// Simple HTML parser for university data
const fs = require('fs');
const path = require('path');

// File paths
const htmlFilePath = path.join(__dirname, 'university_data.html');
const jsonOutputPath = path.join(__dirname, 'university_data.json');

// Function to extract data from HTML using regex patterns
function parseUniversityData(htmlContent) {
  const universities = [];
  
  // Regular expression to find search result blocks
  const searchResultRegex = /<a href="[^"]*" class="search-result">[\s\S]*?<div class="result-title">(.*?)<\/div>[\s\S]*?<div class="result-country">(.*?)<\/div>[\s\S]*?<\/a>/g;
  
  let match;
  while ((match = searchResultRegex.exec(htmlContent)) !== null) {
    const fullTitle = match[1].trim();
    const fullCountryText = match[2].trim();
    
    // Parse country information
    let universityName = '';
    let country = '';
    
    // Split by the last comma to separate country
    const commaIndex = fullCountryText.lastIndexOf(',');
    
    if (commaIndex !== -1) {
      // Extract the country (after the last comma)
      country = fullCountryText.substring(commaIndex + 1).trim();
      
      // Extract university name from the title
      // Title format is usually "GDG on Campus [University Name] - [Location]"
      if (fullTitle.includes('GDG on Campus')) {
        // Extract the part after "GDG on Campus"
        const afterCampus = fullTitle.split('GDG on Campus')[1].trim();
        
        // If there's a dash, extract the part before it
        if (afterCampus.includes(' - ')) {
          universityName = afterCampus.split(' - ')[0].trim();
        } else {
          // If no dash, use the whole string after "GDG on Campus"
          universityName = afterCampus;
        }
      } else {
        // Fallback to the original logic if the title doesn't follow the expected format
        universityName = fullCountryText.substring(0, commaIndex).trim();
      }
    } else {
      // If there's no comma, use the whole text as location/name
      universityName = fullCountryText;
      
      // Try to extract university name from title if possible
      if (fullTitle.includes('GDG on Campus')) {
        const afterCampus = fullTitle.split('GDG on Campus')[1].trim();
        if (afterCampus.includes(' - ')) {
          universityName = afterCampus.split(' - ')[0].trim();
        } else {
          universityName = afterCampus;
        }
      }
    }
    
    universities.push({
      title: fullTitle,
      universityName: universityName,
      country: country,
      fullLocation: fullCountryText
    });
  }
  
  return universities;
}

// Main execution
try {
  console.log('Reading HTML file...');
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  
  console.log('Parsing university data...');
  const universityData = parseUniversityData(htmlContent);
  
  console.log(`Found ${universityData.length} universities.`);
  
  // Save to JSON file
  fs.writeFileSync(jsonOutputPath, JSON.stringify(universityData, null, 2), 'utf8');
  
  console.log(`Data successfully saved to ${jsonOutputPath}`);
} catch (error) {
  console.error('Error:', error.message);
}
