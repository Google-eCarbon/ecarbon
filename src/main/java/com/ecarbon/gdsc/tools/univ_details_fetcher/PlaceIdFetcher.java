package com.ecarbon.gdsc.tools.univ_details_fetcher;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.*;

public class PlaceIdFetcher {

    private static final String API_KEY = "";
    private static final String INPUT_FILE_PLACEID = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/raw/university_data.json";
    private static final String OUTPUT_FILE_PLACEID = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/processed/university_with_placeId.json";

    public static void main(String[] args) throws Exception {
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
}
