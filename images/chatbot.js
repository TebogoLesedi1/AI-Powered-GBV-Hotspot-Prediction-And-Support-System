/* =========================================
   UBUNTU CHATBOT — SafeSouth Africa
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const messagesEl = document.querySelector("#messages");
    const formEl     = document.querySelector("#chat-form");
    const questionEl = document.querySelector("#question");
    const clearBtn   = document.querySelector("#clear-chat");

    if (!messagesEl || !formEl || !questionEl) return;


    // -----------------------------------------
    // DATA SOURCE  (rename the folder to remove the space)
    // -----------------------------------------

    const REPORT_URL = "extractedDatasets/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt";


    // -----------------------------------------
    // STATE
    // -----------------------------------------

    const state = { records: [], ready: false };


    // -----------------------------------------
    // NLP SIGNAL MODEL
    // -----------------------------------------

    const emotional_support_model = {
        intents: {
            emergency:        ["danger","unsafe","threat","hurt","assault","rape","kill","suicid","emergency","help me now"],
            emotional_support:["scared","afraid","anxious","sad","alone","ashamed","overwhelmed","stressed","feel"],
            resources:        ["resource","shelter","clinic","ngo","police","contact","hotline","where can","lawyer","legal"],
            report_lookup:    ["report","study","percentage","prevalence","factor","recommend","method","law","violence","women","men"]
        },
        emotions: {
            fear:     ["scared","afraid","unsafe","threat","danger"],
            distress: ["sad","alone","ashamed","overwhelmed","hurt","cry"],
            anxiety:  ["anxious","worried","stress","panic"]
        }
    };


    // -----------------------------------------
    // HELPERS
    // -----------------------------------------

    function clean(value) {
        return String(value).replaceAll("_", " ").toLowerCase();
    }

    function formatIndicator(value) {
        return String(value).replaceAll("_", " ")
            .toLowerCase()
            .replace(/(^| )\S/g, l => l.toUpperCase());
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        })[c]);
    }


    // -----------------------------------------
    // CSV PARSER (handles quoted fields)
    // -----------------------------------------

    function parseCSV(text) {
        const rows = [];
        let row = [], cell = "", quoted = false;

        for (let i = 0; i < text.length; i += 1) {
            const c = text[i];

            if (c === '"' && text[i + 1] === '"' && quoted) { cell += '"'; i += 1; }
            else if (c === '"') quoted = !quoted;
            else if (c === "," && !quoted) { row.push(cell.trim()); cell = ""; }
            else if ((c === "\n" || c === "\r") && !quoted) {
                if (c === "\r" && text[i + 1] === "\n") i += 1;
                row.push(cell.trim());
                if (row.some(Boolean)) rows.push(row);
                row = []; cell = "";
            }
            else cell += c;
        }

        if (cell || row.length) { row.push(cell.trim()); rows.push(row); }

        const headers = rows.shift();
        return rows.map(values =>
            Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]))
        );
    }


    // -----------------------------------------
    // SIGNAL PREDICTION
    // -----------------------------------------

    function predictSupportSignals(input) {
        const n = clean(input);
        const score = e => e.reduce((t, w) => t + (n.includes(w) ? 1 : 0), 0);

        const intent = Object.entries(emotional_support_model.intents)
            .map(([k, w]) => [k, score(w)])
            .sort((a, b) => b[1] - a[1])[0];

        const emotion = Object.entries(emotional_support_model.emotions)
            .map(([k, w]) => [k, score(w)])
            .sort((a, b) => b[1] - a[1])[0];

        return {
            intent: intent[1] ? intent[0] : "unknown",
            emotion: emotion[1] ? emotion[0] : "neutral",
            confidence: intent[1] ? Math.min(0.98, 0.58 + intent[1] * 0.1) : 0.32
        };
    }


    // -----------------------------------------
    // ANSWER ENGINE
    // -----------------------------------------

    function answerFor(input) {
        const n = clean(input);
        const s = predictSupportSignals(input);


        // --- Safety first ---

        if (s.intent === "emergency") {
            return {
                text: "Your safety matters more than finding an answer in the report. If you are in immediate danger, move to a safer place if you can and contact the police on 10111 or 112 from a mobile. The GBV Command Centre is available on 0800 428 428, or SMS *120*7867#.",
                matches: [],
                intent: "Immediate support",
                tone: `${s.emotion} · safety-first`,
                confidence: s.confidence
            };
        }

        if (s.intent === "emotional_support") {
            return {
                text: `I hear that you may be feeling ${s.emotion}. You do not have to handle this alone. If you are able, consider moving to a trusted person or safer place. I can also share what the report says about support, or help you find contacts.`,
                matches: [],
                intent: "Emotional support",
                tone: `${s.emotion} detected`,
                confidence: s.confidence
            };
        }

        if (s.intent === "resources") {
            return {
                text: "For support in South Africa, contact the GBV Command Centre on 0800 428 428 or SMS *120*7867#. For police or emergency assistance, call 10111 or 112. If you tell me what kind of support you need — a shelter, a clinic, legal aid, or counselling — I can guide the next step.",
                matches: [],
                intent: "Resource referral",
                tone: "Supportive",
                confidence: s.confidence
            };
        }


        // --- Lookup in the report ---

        const words = n.split(/[^a-z0-9]+/)
            .filter(w => w.length > 2 && !["what","does","about","tell","the","are","and","this","study","with","have","your","need","help"].includes(w));

        const scored = state.records.map(record => {
            const haystack = clean(Object.values(record).join(" "));
            const sc = words.reduce((t, w) =>
                t + (haystack.includes(w) ? (haystack.includes(` ${w} `) ? 3 : 1) : 0), 0);
            return { record, score: sc };
        }).filter(i => i.score > 0).sort((a, b) => b.score - a.score);

        const matches = scored.slice(0, 4).map(i => i.record);

        if (!matches.length) {
            return {
                text: "I couldn't find a grounded answer for that in the report. Try asking about prevalence, intimate partner violence, risk factors, help-seeking, laws, recommendations, or the study methodology.",
                matches: [],
                intent: "Unknown",
                tone: "Neutral",
                confidence: s.confidence
            };
        }

        const lead = matches[0];
        const value = lead.value && lead.value_type === "percentage"
            ? `${lead.value}%` : lead.value;
        const note = lead.notes ? ` (${lead.notes})` : "";

        let text = `The report places this under ${formatIndicator(lead.section)}. ${formatIndicator(lead.indicator)} is recorded as ${value || "a qualitative finding"}${note}.`;
        if (matches.length > 1) text += ` I found ${matches.length} related findings in the same evidence set.`;

        return {
            text, matches,
            intent: n.includes("recommend") ? "Recommendations"
                  : n.includes("method")    ? "Methodology"
                  : n.includes("help")      ? "Help-seeking"
                  : "Report lookup",
            tone: "Informational",
            confidence: s.confidence
        };
    }


    // -----------------------------------------
    // RENDER MESSAGE
    // -----------------------------------------

    function addMessage(text, type, result) {
        const article = document.createElement("article");
        article.className = `message ${type}-message`;

        const sourceHTML = result?.matches?.length
            ? `<div class="sources"><strong>Report evidence</strong>${result.matches.map(item =>
                `<div class="source-result"><b>${formatIndicator(item.indicator)}</b> · ${item.value || "qualitative"}${item.value_type === "percentage" ? "%" : ""}${item.notes ? ` · ${item.notes}` : ""}</div>`
              ).join("")}</div>`
            : "";

        const signalHTML = result?.intent
            ? `<div class="signal-row"><span>Intent: <b>${result.intent}</b></span><span>Tone: <b>${result.tone}</b></span>${result.confidence ? `<span>Confidence: <b>${Math.round(result.confidence * 100)}%</b></span>` : ""}</div>`
            : "";

        article.innerHTML =
            `<div class="avatar">${type === "user" ? "Y" : "U"}</div>
             <div class="message-body">
                <span class="message-label">${type === "user" ? "You" : "Ubuntu assistant"} <time>just now</time></span>
                <p>${escapeHTML(text)}</p>
                ${signalHTML}
                ${sourceHTML}
             </div>`;

        messagesEl.append(article);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }


    // -----------------------------------------
    // LOAD REPORT
    // -----------------------------------------

    async function loadReport() {
        try {
            const res = await fetch(REPORT_URL);
            if (!res.ok) throw new Error("Report not found");
            state.records = parseCSV(await res.text());
            state.ready = true;
            console.log(`Chatbot: loaded ${state.records.length} report rows.`);
        } catch (err) {
            console.warn("Chatbot: report could not be loaded.", err);
            state.ready = false;
        }
    }


    // -----------------------------------------
    // SUBMIT
    // -----------------------------------------

    function submit(text) {
        if (!text.trim()) return;
        addMessage(text.trim(), "user");

        const result = state.ready
            ? answerFor(text)
            : { text: "The report is still loading. Please try again in a moment.", matches: [] };

        window.setTimeout(() => addMessage(result.text, "assistant", result), 250);

        questionEl.value = "";
        questionEl.style.height = "auto";
    }


    // -----------------------------------------
    // EVENTS
    // -----------------------------------------

    formEl.addEventListener("submit", e => { e.preventDefault(); submit(questionEl.value); });

    questionEl.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(questionEl.value); }
    });

    questionEl.addEventListener("input", () => {
        questionEl.style.height = "auto";
        questionEl.style.height = `${Math.min(questionEl.scrollHeight, 100)}px`;
    });

    document.querySelectorAll("[data-prompt]").forEach(b => {
        b.addEventListener("click", () => submit(b.dataset.prompt));
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            messagesEl.innerHTML = "";
            addMessage("Conversation cleared. What would you like to explore?", "assistant");
        });
    }

    loadReport();

});