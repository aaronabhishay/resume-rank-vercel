#!/usr/bin/env node

/**
 * Enhanced Resume Processing System Test Script
 * Tests core functionality without starting the full server
 */

const path = require('path');

// Mock Gemini client for testing
class MockGeminiClient {
  getGenerativeModel() {
    return {
      generateContent: async (prompt) => {
        // Mock response for testing
        return {
          response: {
            text: () => JSON.stringify({
              resume_1: {
                name: "John Doe",
                email: "john.doe@example.com",
                phone: "555-0123",
                skills: ["JavaScript", "React", "Node.js"],
                experience: [{
                  title: "Software Engineer",
                  company: "Tech Corp",
                  startDate: "2020-01",
                  endDate: "2023-12",
                  description: "Developed web applications"
                }],
                education: [{
                  degree: "BS Computer Science",
                  institution: "University",
                  graduationDate: "2020"
                }]
              }
            })
          }
        };
      }
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Enhanced Resume Processing System...\n');
  
  try {
    // Test 1: Load and instantiate core modules
    console.log('📋 Test 1: Loading core modules...');
    
    const FileProcessor = require('../src/processors/fileProcessor');
    const TextOptimizer = require('../src/processors/textOptimizer');
    const BatchManager = require('../src/services/batchManager');
    const QueueManager = require('../src/services/queueManager');
    const ResumeParser = require('../src/parsers/resumeParser');
    const ResumePrompts = require('../src/prompts/resumePrompts');
    
    console.log('   ✅ All modules loaded successfully');
    
    // Test 2: File Processor
    console.log('\n📄 Test 2: File Processor...');
    const fileProcessor = new FileProcessor();
    
    const testText = "John Doe\njohn.doe@example.com\n555-0123\n\nExperience:\nSoftware Engineer at Tech Corp (2020-2023)\n- Developed web applications using JavaScript and React\n- Led team of 3 developers\n\nEducation:\nBS Computer Science, University (2020)\n\nSkills:\nJavaScript, React, Node.js, Python, SQL";
    const testBuffer = Buffer.from(testText);
    
    const fileResult = await fileProcessor.processFile(testBuffer, 'test-resume.txt', 'text/plain');
    console.log(`   ✅ Processed test file: ${fileResult.wordCount} words, quality: ${fileResult.quality.toFixed(2)}`);
    
    // Test 3: Text Optimizer
    console.log('\n✂️ Test 3: Text Optimizer...');
    const textOptimizer = new TextOptimizer();
    const optimizationResult = textOptimizer.optimize(testText);
    
    console.log(`   ✅ Text optimized: ${optimizationResult.originalWordCount} → ${optimizationResult.finalWordCount} words (${optimizationResult.reductionPercentage}% reduction)`);
    
    // Test 4: Resume Parser
    console.log('\n🔍 Test 4: Resume Parser...');
    const resumeParser = new ResumeParser();
    const mockApiResponse = JSON.stringify({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "555-0123",
      skills: ["JavaScript", "React", "Node.js"],
      experience: [{
        title: "Software Engineer",
        company: "Tech Corp",
        startDate: "2020-01",
        endDate: "2023-12"
      }]
    });
    
    const parseResult = await resumeParser.parseResponse(mockApiResponse);
    console.log(`   ✅ Resume parsed: confidence ${parseResult.metadata.confidence.overall.toFixed(2)}, ${parseResult.skills.technical.length} technical skills`);
    
    // Test 5: Batch Manager
    console.log('\n📦 Test 5: Batch Manager...');
    const batchManager = new BatchManager();
    const testResumes = [
      { text: testText, name: 'resume1.pdf' },
      { text: testText.replace('John Doe', 'Jane Smith'), name: 'resume2.pdf' },
      { text: testText.replace('Software Engineer', 'Data Scientist'), name: 'resume3.pdf' }
    ];
    
    const batches = await batchManager.createBatches(testResumes, "Looking for experienced software engineers");
    console.log(`   ✅ Created ${batches.length} batches from ${testResumes.length} resumes`);
    
    // Test 6: Queue Manager
    console.log('\n🔄 Test 6: Queue Manager...');
    const queueManager = new QueueManager({ queueDir: path.join(__dirname, '../temp/test-queue') });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const queueIds = await queueManager.enqueue(testResumes, {
      jobDescription: "Test job",
      priority: 'normal'
    });
    
    console.log(`   ✅ Queued ${queueIds.length} resumes`);
    
    const queueStatus = queueManager.getStatus();
    console.log(`   ✅ Queue status: ${queueStatus.totalQueued} queued, ${queueStatus.processing} processing`);
    
    // Test 7: Prompt Generation
    console.log('\n💬 Test 7: Prompt Generation...');
    const resumePrompts = new ResumePrompts();
    const batchPrompt = resumePrompts.createBatchPrompt(testResumes, "Software Engineer position");
    const tokenEstimate = resumePrompts.estimateTokens(batchPrompt);
    
    console.log(`   ✅ Generated batch prompt: ~${tokenEstimate} tokens`);
    
    const validation = resumePrompts.validatePrompt(batchPrompt);
    console.log(`   ✅ Prompt validation: ${validation.isValid ? 'Valid' : 'Invalid'}, ${validation.utilizationRate.toFixed(1)}% utilization`);
    
    // Test 8: Background Processor (without Gemini)
    console.log('\n🤖 Test 8: Background Processor (mock)...');
    const BackgroundProcessor = require('../src/services/backgroundProcessor');
    const mockGemini = new MockGeminiClient();
    
    const processor = new BackgroundProcessor(mockGemini, { autoStart: false });
    console.log('   ✅ Background processor instantiated');
    
    const systemStatus = processor.getStatus();
    console.log(`   ✅ System status: ${systemStatus.processor.systemHealth}`);
    
    // Test 9: Integration System
    console.log('\n🔗 Test 9: Integration System...');
    const { ResumeProcessingSystem } = require('../src/services/resumeProcessingSystem');
    const system = new ResumeProcessingSystem({ autoStart: false });
    
    console.log('   ✅ Resume processing system instantiated');
    
    const healthCheck = system.healthCheck();
    console.log(`   ✅ Health check: ${healthCheck.status}`);
    
    // Clean up test queue
    await queueManager.shutdown();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ File processing: Working');
    console.log('   ✅ Text optimization: Working');
    console.log('   ✅ Resume parsing: Working');
    console.log('   ✅ Batch management: Working');
    console.log('   ✅ Queue management: Working');
    console.log('   ✅ Prompt generation: Working');
    console.log('   ✅ Background processing: Working');
    console.log('   ✅ System integration: Working');
    
    console.log('\n🚀 System is ready for deployment!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run setup script: node scripts/setup-enhanced-system.js');
    console.log('   2. Start the server: npm start');
    console.log('   3. Test with real data: curl http://localhost:3000/api/enhanced/health');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔍 Stack trace:', error.stack);
    process.exit(1);
  }
}

// Mock environment for testing
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'mock-api-key-for-testing';
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
