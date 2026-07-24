/**
 * AegisEye LLM AI Investigator Copilot Engine
 * Handles natural language Q&A, LLM provider integration, session history,
 * Markdown parsing, timestamps, and interactive tactical UI widgets.
 */

const AegisChat = (() => {
  // Session conversation memory array
  let conversationHistory = [];

  /**
   * Format current time (e.g., "10:45 PM")
   */
  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Render Markdown text to HTML safely using Marked.js or fallback
   */
  const parseMarkdown = (markdownText) => {
    if (typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function') {
      try {
        return window.marked.parse(markdownText);
      } catch (e) {
        console.warn('Marked.js error:', e);
      }
    }
    // Simple fallback string formatting
    return markdownText
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  /**
   * Replace [WIDGET:...] tags in LLM text with rich interactive AegisEye UI components
   */
  const replaceWidgetTags = (contentHTML) => {
    const suspects = typeof AegisDB !== 'undefined' ? AegisDB.getSuspects() : [];
    const incidents = typeof AegisDB !== 'undefined' ? AegisDB.getIncidents() : [];

    // 1. Burglary Table Widget
    if (contentHTML.includes('[WIDGET:BURGLARY_TABLE]')) {
      const matches = incidents.filter(i => i.category === 'property' && i.sector.toLowerCase().includes('downtown'));
      const tableWidgetHTML = `
        <div class="chat-embed-widget mt-sm">
          <div class="chat-embed-header">
            <span>Query Results: Downtown Burglaries</span>
            <span class="text-emerald font-bold orbitron">200 OK</span>
          </div>
          <div class="chat-embed-body">
            <table class="chat-embed-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${matches.map(m => `
                  <tr>
                    <td><a href="#" class="text-cyan font-bold text-small" onclick="AegisChat.flyToIncident('${m.id}'); return false;">${m.id}</a></td>
                    <td>${m.title}</td>
                    <td>${m.sector.split(' ')[0]}</td>
                    <td>${m.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-secondary text-small mt-xs">Click Case ID links to locate incident on tactical spatial map.</p>
      `;
      contentHTML = contentHTML.replace('[WIDGET:BURGLARY_TABLE]', tableWidgetHTML);
    }

    // 2. John Doe Dossier Widget
    if (contentHTML.includes('[WIDGET:JOHN_DOE_DOSSIER]')) {
      const joe = suspects.find(s => s.id === 'SP-1082') || { bio: 'Primary suspect in organized heist operations.' };
      const dossierWidgetHTML = `
        <div class="chat-embed-widget mt-sm">
          <div class="chat-embed-header">
            <span>Direct Network Linkages</span>
            <span class="text-cyan font-bold orbitron">Degree = 1</span>
          </div>
          <div class="chat-embed-body flex-column gap-xs">
            <div class="flex-row justify-between text-small border-bottom pb-xs">
              <strong>Marcus 'Slick' Vance</strong>
              <span class="text-cyan font-bold">Accomplice (Narcotics Link)</span>
            </div>
            <div class="flex-row justify-between text-small border-bottom pb-xs mt-xs">
              <strong>Victor 'Dax' Vance</strong>
              <span class="text-cyan font-bold">Accomplice (Vehicle Heist Link)</span>
            </div>
            <div class="flex-row justify-between text-small pb-xs mt-xs">
              <strong>Ford Fusion (49X-Y33)</strong>
              <span class="text-blue font-bold">Operator (Associated Vehicle)</span>
            </div>
          </div>
        </div>
        <button class="btn btn-primary w-100 mt-sm" onclick="AegisChat.highlightNetworkNode('SP-1082')">
          <i class="fa-solid fa-circle-nodes"></i> Focus John Doe in Network Canvas
        </button>
      `;
      contentHTML = contentHTML.replace('[WIDGET:JOHN_DOE_DOSSIER]', dossierWidgetHTML);
    }

    // 3. Forecast Chart Widget
    if (contentHTML.includes('[WIDGET:FORECAST_CHART]')) {
      const chartId = `chat-chart-${Date.now()}`;
      const chartWidgetHTML = `
        <div class="chat-embed-widget mt-sm">
          <div class="chat-embed-header">
            <span>AI 7-Day Time-Series Forecasting</span>
            <span class="text-amber font-bold orbitron">LSTM PROJECTION</span>
          </div>
          <div class="chat-embed-body">
            <div id="${chartId}" style="height: 180px;"></div>
          </div>
        </div>
      `;
      contentHTML = contentHTML.replace('[WIDGET:FORECAST_CHART]', chartWidgetHTML);

      setTimeout(() => {
        const chartEl = document.getElementById(chartId);
        if (chartEl && typeof ApexCharts !== 'undefined') {
          const chart = new ApexCharts(chartEl, {
            chart: { type: 'line', height: 160, toolbar: { show: false }, background: 'transparent', foreColor: '#94A3B8' },
            colors: ['#00F0FF'],
            series: [{ name: 'Predicted Incidents', data: [8, 12, 10, 14, 18, 15, 9] }],
            xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
            stroke: { curve: 'smooth', width: 3 },
            grid: { borderColor: '#1F293D' }
          });
          chart.render();
        }
      }, 150);
    }

    // 4. Hotspot XAI Rationale Widget
    if (contentHTML.includes('[WIDGET:HOTSPOT_XAI]')) {
      const xaiWidgetHTML = `
        <div class="chat-embed-widget mt-sm">
          <div class="chat-embed-header">
            <span>Local SHAP Weight Contributions</span>
            <span class="text-cyan font-bold orbitron">XAI MODEL RATIONALE</span>
          </div>
          <div class="chat-embed-body flex-column gap-sm">
            <div class="feature-bar-item">
              <div class="bar-info"><span>Historical Commercial Burglaries (+46%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-red" style="width: 46%;"></div></div>
            </div>
            <div class="feature-bar-item">
              <div class="bar-info"><span>Street Lighting Deficit (+24%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-amber" style="width: 24%;"></div></div>
            </div>
            <div class="feature-bar-item">
              <div class="bar-info"><span>Patrol Gap Duration (+20%)</span></div>
              <div class="bar-track"><div class="bar-fill bg-cyan" style="width: 20%;"></div></div>
            </div>
          </div>
        </div>
      `;
      contentHTML = contentHTML.replace('[WIDGET:HOTSPOT_XAI]', xaiWidgetHTML);
    }

    // 5. Pathfinder Widget
    if (contentHTML.includes('[WIDGET:JOHN_MARCUS_PATH]')) {
      const pathWidgetHTML = `
        <div class="chat-embed-widget mt-sm" style="background-color: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2)">
          <div class="chat-embed-header" style="background-color: rgba(16,185,129,0.1)">
            <span>Criminal Network Path Highlighted</span>
            <span class="text-emerald font-bold orbitron"><i class="fa-solid fa-circle-check"></i> DISCOVERED</span>
          </div>
          <div class="chat-embed-body flex-column align-center gap-xs">
            <div class="path-step-node w-100" style="border-color: rgba(16,185,129,0.4)"><span class="text-amber">John 'Trigger' Doe</span></div>
            <div class="path-step-arrow text-emerald" style="padding:2px 0;"><i class="fa-solid fa-handshake"></i> Accomplice relationship</div>
            <div class="path-step-node w-100" style="border-color: rgba(16,185,129,0.4)"><span class="text-amber">Marcus 'Slick' Vance</span></div>
          </div>
        </div>
        <button class="btn btn-secondary w-100 mt-sm" onclick="AegisChat.teleportToPathfinder('SP-1082', 'SP-2241')">
          <i class="fa-solid fa-route text-cyan"></i> Visualise Path inside Network tab
        </button>
      `;
      contentHTML = contentHTML.replace('[WIDGET:JOHN_MARCUS_PATH]', pathWidgetHTML);
    }

    return contentHTML;
  };

  /**
   * Append a chat message element to the chat logs container
   */
  const appendMessage = (sender, textContent, rawHTML = null) => {
    const container = document.getElementById("chat-messages");
    if (!container) return null;

    const msg = document.createElement("div");
    msg.className = `chat-message ${sender}`;

    const iconClass = sender === "bot" ? "fa-robot" : "fa-user-nurse";
    const timestamp = getTimestamp();

    let bodyHTML = "";
    if (rawHTML) {
      bodyHTML = rawHTML;
    } else {
      bodyHTML = parseMarkdown(textContent);
      bodyHTML = replaceWidgetTags(bodyHTML);
    }

    msg.innerHTML = `
      <div class="message-avatar"><i class="fa-solid ${iconClass}"></i></div>
      <div class="message-bubble">
        ${bodyHTML}
        <span class="message-timestamp">${timestamp}</span>
      </div>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  };

  /**
   * Show typing indicator loader bubble
   */
  const showTypingIndicator = () => {
    const container = document.getElementById("chat-messages");
    if (!container) return null;

    const msg = document.createElement("div");
    msg.className = "chat-message bot typing-message";
    msg.id = "chat-typing-indicator";

    msg.innerHTML = `
      <div class="message-avatar"><i class="fa-solid fa-robot animate-pulse"></i></div>
      <div class="message-bubble">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
          <span class="text-secondary italic text-small ml-xs">AegisEye AI Copilot is thinking...</span>
        </div>
      </div>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  };

  /**
   * Remove typing indicator loader bubble
   */
  const hideTypingIndicator = () => {
    const typingEl = document.getElementById("chat-typing-indicator");
    if (typingEl) typingEl.remove();
  };

  /**
   * Send user message to LLM Backend API (/api/chat)
   */
  const handleUserSubmit = async (queryText) => {
    const text = queryText.trim();
    if (!text) return;

    // 1. Render user message
    appendMessage("user", text);

    // 2. Show typing indicator
    showTypingIndicator();

    try {
      // 3. Call /api/chat endpoint with message and conversation history
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: conversationHistory
        })
      });

      hideTypingIndicator();

      if (response.ok) {
        const data = await response.json();
        const aiReply = data.response || "No response generated.";

        // Append to local history for context awareness
        conversationHistory.push({ role: "user", content: text });
        conversationHistory.push({ role: "assistant", content: aiReply });

        // Render AI message with Markdown and Widgets
        appendMessage("bot", aiReply);
      } else {
        const errData = await response.json().catch(() => ({}));
        appendMessage("bot", `> [!WARNING]\n> **AI Assistant Error**: ${errData.error || 'Server request failed.'}`);
      }
    } catch (error) {
      console.error("Chat API fetch error:", error);
      hideTypingIndicator();
      appendMessage("bot", `> [!WARNING]\n> **Connection Error**: Unable to reach AI Copilot backend server. Please check connection.`);
    }
  };

  /**
   * Initialize chat event listeners and suggested query chips
   */
  const init = () => {
    const inputField = document.getElementById("chat-input-field");
    const sendBtn = document.getElementById("btn-send-chat");

    if (sendBtn && inputField) {
      // Send button click
      sendBtn.addEventListener("click", () => {
        handleUserSubmit(inputField.value);
        inputField.value = "";
      });

      // Enter key trigger
      inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleUserSubmit(inputField.value);
          inputField.value = "";
        }
      });
    }

    // Bind Suggested Query chips as quick action triggers
    const suggestions = document.querySelectorAll(".suggestion-chip");
    suggestions.forEach(chip => {
      chip.addEventListener("click", () => {
        const queryText = chip.getAttribute("data-query");
        if (queryText) {
          handleUserSubmit(queryText);
        }
      });
    });
  };

  // --- Cross-tab Navigation Handlers ---
  const highlightNetworkNode = (susId) => {
    const netMenu = document.querySelector('.menu-item[data-tab="network"]');
    if (netMenu) {
      netMenu.click();
      setTimeout(() => {
        if (typeof AegisNetwork !== 'undefined') AegisNetwork.highlightSuspectNode(susId);
      }, 400);
    }
  };

  const teleportToPathfinder = (startId, endId) => {
    const netMenu = document.querySelector('.menu-item[data-tab="network"]');
    if (netMenu) {
      netMenu.click();
      setTimeout(() => {
        const sEl = document.getElementById("path-start-node");
        const eEl = document.getElementById("path-end-node");
        if (sEl) sEl.value = startId;
        if (eEl) eEl.value = endId;
        document.getElementById("btn-find-path")?.click();
      }, 400);
    }
  };

  const flyToIncident = (incId) => {
    if (typeof AegisDB === 'undefined') return;
    const inc = AegisDB.getIncidents().find(i => i.id === incId);
    if (!inc) return;

    const mapMenu = document.querySelector('.menu-item[data-tab="map"]');
    if (mapMenu) {
      mapMenu.click();
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("mapFlyToCoordinates", {
          detail: { coords: inc.location, title: inc.title, desc: inc.description }
        }));
      }, 400);
    }
  };

  // Public Interface
  return {
    init: init,
    highlightNetworkNode: highlightNetworkNode,
    teleportToPathfinder: teleportToPathfinder,
    flyToIncident: flyToIncident
  };
})();
