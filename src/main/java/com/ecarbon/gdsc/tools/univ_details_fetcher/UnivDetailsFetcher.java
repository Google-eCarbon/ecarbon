package com.ecarbon.gdsc.tools.univ_details_fetcher;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.*;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Slf4j
public class UnivDetailsFetcher {

    private static final String API_KEY = "";

    private static final String INPUT_FILE_PLACEID = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/raw/university_data.json";
    private static final String OUTPUT_FILE_PLACEID = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/processed/university_with_placeId.json";

    private static final String INPUT_FILE_PLACE_DETAILS = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/processed/university_with_placeId.json";
    private static final String OUTPUT_FILE_PLACE_DETAILS = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/processed/place_details.json";

    public static void main(String[] args){
        try {
            fetchPlaceIds();
            fetchPlaceDetails();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private static void fetchPlaceIds() throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        // 기존 정보 전체 불러오기
        List<UniversityLocationInfo> universityInfos = mapper.readValue(
                new File(INPUT_FILE_PLACEID), new TypeReference<List<UniversityLocationInfo>>() {});

        // 각 객체에 placeId 추가
        for (UniversityLocationInfo info : universityInfos) {
            String placeId = fetchPlaceId(info.universityName);
            info.setPlaceId(placeId);
            System.out.println(info.universityName + " : " + placeId);
            Thread.sleep(100); // rate limit 방지
        }

        // 전체 객체 리스트를 JSON으로 저장
        mapper.writerWithDefaultPrettyPrinter().writeValue(new File(OUTPUT_FILE_PLACEID), universityInfos);
    }

    private static String fetchPlaceId(String name) {
        try {
            String encodedName = URLEncoder.encode(name, "UTF-8");
            String apiUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input="
                    + encodedName + "&key=" + API_KEY + "&language=en&types=establishment";

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            InputStream inputStream = conn.getInputStream();
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> response = mapper.readValue(inputStream, Map.class);

            List<Map<String, Object>> predictions = (List<Map<String, Object>>) response.get("predictions");
            if (predictions != null && !predictions.isEmpty()) {
                return (String) predictions.get(0).get("place_id");
            }

        } catch (Exception e) {
            System.err.println("Error fetching Place ID for: " + name);
            e.printStackTrace();
        }
        return null;
    }

    private static void fetchPlaceDetails() {
        try {
            String jsonInput = new String(Files.readAllBytes(Paths.get(INPUT_FILE_PLACE_DETAILS)));
            JsonArray inputArray = JsonParser.parseString(jsonInput).getAsJsonArray();
            JsonArray resultsArray = new JsonArray();
            JsonArray invalidPlaceIdsArray = new JsonArray();

            for (JsonElement element : inputArray) {
                JsonObject obj = element.getAsJsonObject();

                if (!obj.has("placeId") || obj.get("placeId").isJsonNull()) {
                    log.info("⚠️ placeId가 null이거나 존재하지 않습니다. 건너뜁니다: " + obj);
                    invalidPlaceIdsArray.add(obj.deepCopy()); // 깊은 복사
                    continue;
                }

                String placeId = obj.get("placeId").getAsString();
                String urlString = String.format(
                        "https://maps.googleapis.com/maps/api/place/details/json" +
                                "?fields=" +
                                "name," +
                                "formatted_address," +
                                "geometry,website," +
                                "place_id," +
                                "website" +
                                "&place_id=%s&key=%s", placeId, API_KEY);

                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");

                int responseCode = conn.getResponseCode();
                log.info("[" + placeId + "] 응답 코드: " + responseCode);

                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    String inputLine;
                    StringBuilder response = new StringBuilder();

                    while ((inputLine = in.readLine()) != null) {
                        response.append(inputLine);
                    }
                    in.close();

                    JsonObject responseJson = JsonParser.parseString(response.toString()).getAsJsonObject();

                    if (responseJson.has("result")) {
                        resultsArray.add(responseJson.get("result"));
                    } else {
                    }
                } else {
                    log.info("❌ 요청 실패: " + placeId);
                }

                Thread.sleep(200); // 대기 시간 증가
            }

            // 결과 저장
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            try (FileWriter writer = new FileWriter(OUTPUT_FILE_PLACE_DETAILS)) {
                gson.toJson(resultsArray, writer);
                log.info("✅ 유효한 결과를 '" + OUTPUT_FILE_PLACE_DETAILS + "'에 저장하였습니다.");
            }

            if (invalidPlaceIdsArray.size() > 0) {
                try (FileWriter invalidWriter = new FileWriter("invalid_placeIds.json")) {
                    gson.toJson(invalidPlaceIdsArray, invalidWriter);
                    log.info("⚠️ 유효하지 않은 항목들을 'invalid_placeIds.json'에 저장했습니다.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
