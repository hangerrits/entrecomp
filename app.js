// app.js - EntreComp Assessment Tool

document.addEventListener('DOMContentLoaded', function() {
    // App state
    const state = {
      currentView: 'start', // 'start', 'assessment', 'results'
      userInfo: {
        name: '',
        email: '',
        organization: ''
      },
      currentQuestion: 0,
      assessmentResults: {},
    };
  
    // Framework data structure
    const framework = {
      sections: [
        {
          title: "Ideas and Opportunities",
          competences: [
            {
              name: "Spotting Opportunities",
              description: "Use your imagination and abilities to identify opportunities for creating value.",
              questions: [
                { text: "I can find opportunities to help others.", level: 1 },
                { text: "I can recognise opportunities to create value in my community and surroundings.", level: 2 },
                { text: "I can explain what makes an opportunity to create value.", level: 3 },
                { text: "I can proactively look for opportunities to create value, including out of necessity.", level: 4 },
                { text: "I can describe different analytical approaches to identify entrepreneurial opportunities.", level: 5 },
                { text: "I can use my knowledge and understanding of the context to make opportunities to create value.", level: 6 },
                { text: "I can judge opportunities for creating value and decide whether to follow these up at different levels of the system I am working in.", level: 7 },
                { text: "I can spot and quickly take advantage of an opportunity.", level: 8 }
              ]
            },
            // ... (rest of the original competences remain the same)
          ]
        },
        // ... (rest of the sections remain the same)
      ]
    };
  
    // Flatten questions for navigation
    const allQuestions = [];
    framework.sections.forEach(section => {
      section.competences.forEach(competence => {
        competence.questions.forEach(question => {
          allQuestions.push({
            sectionTitle: section.title,
            competenceName: competence.name,
            text: question.text,
            level: question.level,
            id: `${section.title}-${competence.name}-${question.text}`
          });
        });
      });
    });
  
    // Calculate total questions
    const totalQuestions = allQuestions.length;
  
    // Function to calculate progress
    function calculateProgress() {
      return Math.round((Object.keys(state.assessmentResults).length / totalQuestions) * 100);
    }
  
    // Save assessment to server
    async function saveAssessmentToServer() {
      try {
        const results = calculateResults();
        
        const response = await fetch('/api/save-assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: state.userInfo,
            results: results,
            rawAnswers: state.assessmentResults
          })
        });
        
        const responseData = await response.json();
        
        if (responseData.success) {
          console.log(`Assessment saved on server as ${responseData.filename}`);
          return true;
        } else {
          throw new Error(responseData.error || 'Unknown error');
        }
      } catch (error) {
        console.error("Error saving to server:", error);
        alert("There was an error saving your assessment to the server. Your results are still displayed, but may not be permanently saved.");
        return false;
      }
    }
  
    // Export results as JSON file
    function exportResults() {
      try {
        const results = calculateResults();
        const exportData = {
          user: state.userInfo,
          assessmentDate: new Date().toISOString(),
          results: results,
          rawAnswers: state.assessmentResults
        };
        
        // Convert to JSON string
        const jsonData = JSON.stringify(exportData, null, 2);
        
        // Create a blob and download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `EntreComp_Assessment_${state.userInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
      } catch (error) {
        console.error('Error exporting results:', error);
        alert(`Error exporting results: ${error.message}`);
        return false;
      }
    }
  
    // Handle selection of proficiency level
    function handleSelection(questionId, level) {
      state.assessmentResults[questionId] = level;
      
      // Move to next question if not at the end
      if (state.currentQuestion < allQuestions.length - 1) {
        state.currentQuestion++;
        renderApp();
      } else {
        // If this is the last question, save to server and show results
        saveAssessmentToServer();
        state.currentView = 'results';
        renderApp();
      }
    }
  
    // Calculate results
    function calculateResults() {
      const competenceResults = {};
      
      framework.sections.forEach(section => {
        section.competences.forEach(competence => {
          const competenceId = `${section.title}-${competence.name}`;
          const answeredQuestions = competence.questions.filter(q => 
            state.assessmentResults[`${section.title}-${competence.name}-${q.text}`] !== undefined
          );
          
          if (answeredQuestions.length > 0) {
            const totalScore = answeredQuestions.reduce((sum, q) => {
              return sum + (state.assessmentResults[`${section.title}-${competence.name}-${q.text}`] || 0);
            }, 0);
            
            const averageScore = totalScore / answeredQuestions.length;
            
            // Map the 0-4 score range to the EntreComp levels (0-8)
            const mappedLevel = averageScore === 0 ? 0 : Math.min(8, averageScore * 2);
            
            competenceResults[competenceId] = {
              name: competence.name,
              section: section.title,
              averageLevel: Math.round(mappedLevel),
              rawScore: averageScore,
              answeredCount: answeredQuestions.length,
              totalQuestions: competence.questions.length
            };
          }
        });
      });
      
      return competenceResults;
    }
  
    // Render the current view
    function renderApp() {
      const appContainer = document.getElementById('app');
      appContainer.innerHTML = '';
  
      if (state.currentView === 'start') {
        renderStartScreen(appContainer);
      } else if (state.currentView === 'assessment') {
        renderAssessmentScreen(appContainer);
      } else if (state.currentView === 'results') {
        renderResultsScreen(appContainer);
      }
    }
  
    // Render start screen
    function renderStartScreen(container) {
      container.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
          <h1 class="text-2xl font-bold text-center mb-4">EntreComp Assessment</h1>
          <p class="mb-4 text-gray-600">
            This tool helps you assess your entrepreneurial competences based on the EntreComp framework.
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text" 
                id="name-input"
                value="${state.userInfo.name}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email-input"
                value="${state.userInfo.email}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Organization (optional)</label>
              <input
                type="text"
                id="organization-input"
                value="${state.userInfo.organization}"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              id="start-button"
              class="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Start Assessment
            </button>
          </div>
        </div>
      `;
  
      // Add event listeners
      document.getElementById('name-input').addEventListener('input', (e) => {
        state.userInfo.name = e.target.value;
      });
      
      document.getElementById('email-input').addEventListener('input', (e) => {
        state.userInfo.email = e.target.value;
      });
      
      document.getElementById('organization-input').addEventListener('input', (e) => {
        state.userInfo.organization = e.target.value;
      });
      
      document.getElementById('start-button').addEventListener('click', () => {
        if (state.userInfo.name && state.userInfo.email && state.userInfo.email.includes('@')) {
          state.currentView = 'assessment';
          renderApp();
        } else {
          alert('Please enter a valid name and email');
        }
      });
    }
  
    // Render assessment screen
    function renderAssessmentScreen(container) {
      const currentQ = allQuestions[state.currentQuestion];
      const progress = calculateProgress();
      
      container.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-lg mx-auto">
          <h1 class="text-xl font-bold mb-4">EntreComp Assessment</h1>
          
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">Progress</span>
              <span class="text-sm font-medium">${progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
            </div>
          </div>
          
          <div class="mb-6">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${currentQ.sectionTitle}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2">
              ${currentQ.competenceName}
            </span>
          </div>
          
          <h2 class="text-lg font-medium mb-2">
            ${currentQ.text}
          </h2>
          
          <p class="text-sm text-gray-600 mb-6">
            This assessment statement is related to ${currentQ.competenceName} competence in the ${currentQ.sectionTitle} area of the EntreComp framework.
          </p>
          
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700 mb-2">How would you assess your ability regarding this competence?</p>
            
            <div class="grid grid-cols-1 gap-3">
              <div 
                class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex items-center option-button"
                data-level="0"
              >
                <div class="h-4 w-4 rounded-full border border-gray-300 mr-3 flex-shrink-0"></div>
                <div>
                  <p class="font-medium">I cannot do this yet</p>
                  <p class="text-sm text-gray-600">I have no experience with this competence</p>
                </div>
              </div>
  
              <div 
                class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex items-center option-button"
                data-level="1"
              >
                <div class="h-4 w-4 rounded-full border border-gray-300 mr-3 flex-shrink-0 bg-red-100"></div>
                <div>
                  <p class="font-medium">I can do this with guidance</p>
                  <p class="text-sm text-gray-600">Level 1-2: Foundation - I need direct supervision or some support</p>
                </div>
              </div>
              
              <div 
                class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex items-center option-button"
                data-level="2"
              >
                <div class="h-4 w-4 rounded-full border border-gray-300 mr-3 flex-shrink-0 bg-yellow-100"></div>
                <div>
                  <p class="font-medium">I can do this independently</p>
                  <p class="text-sm text-gray-600">Level 3-4: Intermediate - I can do this on my own and take some responsibility</p>
                </div>
              </div>
              
              <div 
                class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex items-center option-button"
                data-level="3"
              >
                <div class="h-4 w-4 rounded-full border border-gray-300 mr-3 flex-shrink-0 bg-green-100"></div>
                <div>
                  <p class="font-medium">I can guide others to do this</p>
                  <p class="text-sm text-gray-600">Level 5-6: Advanced - I can take responsibility and help others with this</p>
                </div>
              </div>
              
              <div 
                class="border rounded-md p-3 cursor-pointer hover:bg-gray-50 flex items-center option-button"
                data-level="4"
              >
                <div class="h-4 w-4 rounded-full border border-gray-300 mr-3 flex-shrink-0 bg-blue-100"></div>
                <div>
                  <p class="font-medium">I can drive innovation in this area</p>
                  <p class="text-sm text-gray-600">Level 7-8: Expert - I contribute to complex developments and innovation</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-between mt-6">
            <button 
                id="prev-button"
                class="px-4 py-2 rounded-md ${state.currentQuestion === 0 ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}"
                ${state.currentQuestion === 0 ? 'disabled' : ''}
                >
                Previous
            </button>
              
              <div>
                <span class="text-sm text-gray-600">
                  Question ${state.currentQuestion + 1} of ${allQuestions.length}
                </span>
              </div>
              
              <button 
                id="next-button"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ${state.currentQuestion === allQuestions.length - 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          </div>
        `;
    
        // Add event listeners for option buttons
        document.querySelectorAll('.option-button').forEach(button => {
          button.addEventListener('click', () => {
            const level = parseInt(button.getAttribute('data-level'));
            handleSelection(`${currentQ.sectionTitle}-${currentQ.competenceName}-${currentQ.text}`, level);
          });
        });
    
        // Add event listener for previous button
        document.getElementById('prev-button').addEventListener('click', () => {
          if (state.currentQuestion > 0) {
            state.currentQuestion--;
            renderApp();
          }
        });
    
        // Add event listener for next/submit button
        document.getElementById('next-button').addEventListener('click', () => {
          if (state.currentQuestion < allQuestions.length - 1) {
            state.currentQuestion++;
            renderApp();
          } else {
            saveAssessmentToServer();
            state.currentView = 'results';
            renderApp();
          }
        });
      }
    
      // Render results screen
      function renderResultsScreen(container) {
        const results = calculateResults();
        
        let resultsHTML = `
          <div class="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
            <h1 class="text-2xl font-bold mb-4 text-center">Your EntreComp Results</h1>
            
            <div class="mb-4">
              <h2 class="text-lg font-semibold mb-2">Thank you, ${state.userInfo.name}!</h2>
              <p class="text-gray-600">
                Here are your entrepreneurial competence assessment results.
              </p>
            </div>
            
            <div class="space-y-8">
        `;
        
        framework.sections.forEach(section => {
          resultsHTML += `
            <div class="border-t pt-4">
              <h3 class="text-xl font-bold mb-4">${section.title}</h3>
              <div class="space-y-4">
          `;
          
          section.competences.forEach(competence => {
            const resultKey = `${section.title}-${competence.name}`;
            const result = results[resultKey];
            
            if (!result) {
              resultsHTML += `
                <div class="bg-gray-50 p-4 rounded opacity-50">
                  <h4 class="font-semibold">${competence.name}</h4>
                  <p class="text-sm text-gray-600">No data available</p>
                </div>
              `;
              return;
            }
            
            let colorClass = '';
            let levelText = '';
            let capabilityText = '';
            let levelNumber = 0;
            
            if (result.averageLevel === 0) {
              colorClass = 'bg-gray-400';
              levelText = 'Not yet developed';
              capabilityText = 'You indicated you do not have this competence yet.';
              levelNumber = 0;
            } else if (result.averageLevel <= 2) {
              colorClass = 'bg-red-500';
              levelText = 'Foundation (Level 1-2)';
              capabilityText = 'You can do this with guidance.';
              levelNumber = 1;
            } else if (result.averageLevel <= 4) {
              colorClass = 'bg-yellow-500';
              levelText = 'Intermediate (Level 3-4)';
              capabilityText = 'You can do this independently.';
              levelNumber = 3;
            } else if (result.averageLevel <= 6) {
              colorClass = 'bg-green-500';
              levelText = 'Advanced (Level 5-6)';
              capabilityText = 'You can guide others to do this.';
              levelNumber = 5;
            } else {
              colorClass = 'bg-blue-600';
              levelText = 'Expert (Level 7-8)';
              capabilityText = 'You can drive innovation in this area.';
              levelNumber = 7;
            }
            
            resultsHTML += `
              <div class="bg-gray-50 p-4 rounded">
                <h4 class="font-semibold" data-level="${levelNumber}">${competence.name}</h4>
                <div class="mt-2">
                  <div class="flex items-center">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        class="${colorClass} h-2.5 rounded-full" 
                        style="width: ${(result.averageLevel / 8) * 100}%"
                      ></div>
                    </div>
                    <span class="ml-2 text-sm font-medium">
                      ${levelText}
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">
                    You answered ${result.answeredCount} out of ${result.totalQuestions} questions in this competence.
                  </p>
                  <p class="mt-1 text-sm text-gray-600 font-medium">
                    ${capabilityText}
                  </p>
                </div>
              </div>
            `;
          });
          
          resultsHTML += `
              </div>
            </div>
          `;
        });
        
        resultsHTML += `
            </div>
            
            <div class="mt-6 text-center">
              <button
                id="start-again-button"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-4"
              >
                Start Again
              </button>
              
              <button
                id="export-button"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-4"
              >
                Export Results
              </button>
              
              <button
                id="print-button"
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Print Results
              </button>
            </div>
          </div>
        `;
        
        container.innerHTML = resultsHTML;
        
        // Add event listeners
        document.getElementById('start-again-button').addEventListener('click', () => {
          state.currentView = 'start';
          state.currentQuestion = 0;
          state.assessmentResults = {};
          renderApp();
        });
        
        document.getElementById('export-button').addEventListener('click', exportResults);
        
        document.getElementById('print-button').addEventListener('click', () => {
          window.print();
        });
      }
    
      // Initialize app
      renderApp();
    });