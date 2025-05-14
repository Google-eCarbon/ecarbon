const fs = require('fs');
const path = require('path');

// Path to the input JSON file
const inputFilePath = path.join(__dirname, 'uni_website.json');
// Path to the output JSON file
const outputFilePath = path.join(__dirname, 'university_websites.json');

// Function to extract website URLs from university data
function extractWebsiteUrls(data) {
  const websites = [];
  
  // Loop through each university entry
  data.forEach(university => {
    // Check if the university has a website property
    if (university.website) {
      // Add the website URL to our array
      websites.push({
        name: university.name,
        website: university.website
      });
    }
  });
  
  return websites;
}

// Main function to read the input file, extract URLs, and write to output file
function main() {
  try {
    // Read the input JSON file
    const rawData = fs.readFileSync(inputFilePath, 'utf8');
    const universityData = JSON.parse(rawData);
    
    // Extract website URLs
    const websiteUrls = extractWebsiteUrls(universityData);
    
    // Write the extracted URLs to the output file
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify({ universities: websiteUrls }, null, 2),
      'utf8'
    );
    
    console.log(`Successfully extracted ${websiteUrls.length} website URLs to ${outputFilePath}`);
  } catch (error) {
    console.error('Error processing university data:', error.message);
  }
}

// Run the main function
main();