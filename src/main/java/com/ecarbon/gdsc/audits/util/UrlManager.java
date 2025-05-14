package com.ecarbon.gdsc.audits.util;

import com.ecarbon.gdsc.audits.dto.PlaceDetails;
import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
public class UrlManager {
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?:\\/\\/)?([\\w.-]+)\\.([a-z]{2,6})([\\w.-]*)*\\/?$");

    public List<PlaceDetails> filterValidInstitutions(String filePath) {
        List<PlaceDetails> validInstitutions = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();
        JsonFactory jsonFactory = new JsonFactory();

        try (JsonParser parser = jsonFactory.createParser(new File(filePath))) {
            if (parser.nextToken() != JsonToken.START_ARRAY) {
                throw new IOException("Invalid JSON file format.");
            }
            while (parser.nextToken() == JsonToken.START_OBJECT) {
                PlaceDetails institution = objectMapper.readValue(parser, PlaceDetails.class);

                if (isValidUrl(institution.getWebsite())) {
                    validInstitutions.add(institution);
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return validInstitutions;
    }

    private static boolean isValidUrl(String url) {
        return url != null && URL_PATTERN.matcher(url).matches();
    }
}