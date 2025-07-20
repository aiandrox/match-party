const { chromium } = require('playwright');

async function generateOGPImage() {
  console.log('🖼️ Generating OGP image with Playwright...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to OGP standard size
  await page.setViewportSize({
    width: 1200,
    height: 630
  });
  
  try {
    console.log('📱 Navigating to OGP preview page...');
    await page.goto('http://localhost:3000/ogp-preview', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for content to be fully loaded
    await page.waitForSelector('h1', { timeout: 10000 });
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: 'public/og-image.jpg',
      type: 'jpeg',
      quality: 90,
      fullPage: false // Use viewport size
    });
    
    console.log('✅ OGP image generated successfully at public/og-image.jpg');
    
  } catch (error) {
    console.error('❌ Error generating OGP image:', error.message);
    console.log('💡 Make sure the development server is running at http://localhost:3000/ogp-preview');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
generateOGPImage().catch(console.error);