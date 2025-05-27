// src/sections-data/saleToDeliveryQuestions.js

export const getSaleToDeliveryProcessQuestions = (sectionName) => { 
    return [
        // --- Preguntas de Definición de Producto/Servicio ---
        {
            id: "s2d_productName",
            section: sectionName, // MODIFICACIÓN: Añadido
            text: "Name of Product/Service:",
            type: "text",
            valueKey: "s2d_productName",
            required: true,
        },
        {
            id: "s2d_productDescription",
            section: sectionName, // MODIFICACIÓN: Añadido
            text: "Description of Product/Service:",
            type: "textarea",
            valueKey: "s2d_productDescription",
            required: true,
            rows: 4
        },
        {
            id: "s2d_productRevenue",
            section: sectionName, // MODIFICACIÓN: Añadido
            text: "Annual Revenue of Product/Service:",
            type: "number",
            valueKey: "s2d_productRevenue",
            placeholder: "e.g., 500000",
            required: true,
        },

        // --- 1. Contract and Payment Processing ---
        {
            id: "s2d_q1_process",
            section: sectionName,
            text: "1. Service/Product Delivery Process: How would you describe your execution and quality control processes during service/product delivery?",
            type: "mcq",
            valueKey: "s2d_q1_process",
            groupTitle: "RESULTS: Service/Product Delivery Excellence",
            options: [
                { text: "We have a comprehensive, documented delivery system with clear quality standards, regular checkpoints, and continuous improvement mechanisms. Every team member follows consistent processes that ensure exceptional delivery quality. We track error rates, completion times, and quality metrics systematically.", value: "a", score: 7 },
                { text: "We have standardized delivery procedures with defined quality expectations. Most team members follow these processes consistently, and we have basic mechanisms to identify and address quality issues.", value: "b", score: 5 },
                { text: "We have some documented delivery procedures, but they may not be consistently followed. Quality control happens but isn't systematic. Delivery quality can vary depending on who's doing the work.", value: "c", score: 3 },
                { text: "Our delivery process is largely ad-hoc, with significant variation in how work is performed. Quality control is reactive rather than proactive.", value: "d", score: 1 },
                { text: "We don't have defined delivery processes or quality standards, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q1_owner",
            section: sectionName,
            text: "How involved is the owner in day-to-day service/product delivery?",
            type: "mcq",
            valueKey: "s2d_q1_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 2: Customer Success Measurement & Results Tracking ---
        {
            id: "s2d_q2_process",
            section: sectionName,
            text: "2. Customer Success Measurement & Results Tracking: How do you measure and track whether customers are achieving their desired results?",
            type: "mcq",
            valueKey: "s2d_q2_process",
            groupTitle: "RESULTS: Service/Product Delivery Excellence",
            options: [
                { text: "We have multiple systematic methods (e.g., NPS, CSAT, success metrics) implemented at strategic touchpoints. We analyze this data regularly, track trends, and have clear processes for addressing feedback. Success metrics are defined collaboratively with clients and monitored throughout their journey with milestone celebrations.", value: "a", score: 7 },
                { text: "We consistently gather customer feedback using a standard methodology (e.g., NPS or CSAT). We review this data periodically and generally act on significant feedback. We track some form of success metrics for clients with basic milestone recognition.", value: "b", score: 5 },
                { text: "We collect feedback inconsistently or informally. We may respond to issues raised, but don't systematically analyze trends. Success metrics are general rather than client-specific.", value: "c", score: 3 },
                { text: "We rely primarily on passive feedback (e.g., customers who volunteer complaints). We have minimal formal success measurement.", value: "d", score: 1 },
                { text: "We don't have formal customer success measurement processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q2_owner",
            section: sectionName,
            text: "How involved is the owner in measuring and tracking customer results?",
            type: "mcq",
            valueKey: "s2d_q2_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 3: Issue Resolution and Customer Support ---
        {
            id: "s2d_q3_process",
            section: sectionName,
            text: "3. Issue Resolution and Customer Support: How effectively do you address customer issues or support requests?",
            type: "mcq",
            valueKey: "s2d_q3_process",
            groupTitle: "RETENTION: Issue Resolution & Proactive Support",
            options: [
                { text: "We have a robust, multichannel support system with clear SLAs, escalation procedures, and tracking mechanisms. All issues are documented, categorized, and analyzed for patterns. We proactively identify and resolve potential issues before customers even notice them. Support quality and resolution times are consistently measured.", value: "a", score: 7 },
                { text: "We have established support channels and documented procedures for handling issues. Most problems are addressed in a timely manner, and we track basic metrics like resolution time. We occasionally review past issues for improvement opportunities.", value: "b", score: 5 },
                { text: "We have basic support processes but they may not be fully documented or consistently followed. Response times can vary, and we don't systematically track support performance or analyze issue patterns.", value: "c", score: 3 },
                { text: "Our support is largely reactive and ad-hoc. We address issues as they arise, but without standard procedures or performance tracking.", value: "d", score: 1 },
                { text: "We don't have defined support processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q3_owner",
            section: sectionName,
            text: "How involved is the owner in resolving customer issues?",
            type: "mcq",
            valueKey: "s2d_q3_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 4: Customer Success Management and Proactive Support ---
        {
            id: "s2d_q4_process",
            section: sectionName,
            text: "4. Customer Success Management and Proactive Support: How proactively do you manage ongoing customer relationships to ensure retention?",
            type: "mcq",
            valueKey: "s2d_q4_process",
            groupTitle: "RETENTION: Issue Resolution & Proactive Support",
            options: [
                { text: "We have a formal customer success program with dedicated personnel, scheduled check-ins, and individualized success plans. We proactively identify opportunities to add value, address potential issues before they arise, and systematically work to improve outcomes. Usage data and success metrics are actively monitored with early warning systems for at-risk customers.", value: "a", score: 7 },
                { text: "We conduct regular check-ins with customers and have some proactive measures to ensure customer success. Key accounts have basic success plans, and we generally anticipate common needs or issues.", value: "b", score: 5 },
                { text: "We maintain communication with customers but our approach is somewhat reactive. Check-ins may happen inconsistently, and our ability to anticipate needs varies.", value: "c", score: 3 },
                { text: "Our ongoing customer management is minimal or happens only when problems arise. We primarily rely on customers to reach out when they need something.", value: "d", score: 1 },
                { text: "We don't have proactive customer success management, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q4_owner",
            section: sectionName,
            text: "How involved is the owner in ongoing customer success management?",
            type: "mcq",
            valueKey: "s2d_q4_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 5: Retention and Renewal Processes ---
        {
            id: "s2d_q5_process",
            section: sectionName,
            text: "5. Retention and Renewal Processes: How systematic are your processes for retaining customers and securing renewals or repeat business?",
            type: "mcq",
            valueKey: "s2d_q5_process",
            groupTitle: "RETENTION: Issue Resolution & Proactive Support",
            options: [
                { text: "We have a comprehensive retention strategy with early warning systems for at-risk customers, proactive renewal processes, and multi-layered retention tactics. We track retention metrics by segment, analyze churn causes in detail, and have documented recovery procedures. Our renewal process begins well in advance and includes systematic value reinforcement.", value: "a", score: 7 },
                { text: "We have defined retention and renewal processes that we follow fairly consistently. We monitor for at-risk customers, begin renewal conversations at appropriate times, and make systematic efforts to demonstrate ongoing value.", value: "b", score: 5 },
                { text: "We have basic renewal procedures but they may not be fully documented or consistently followed. Our approach to retention is somewhat reactive, and we may not identify at-risk customers until late in the process.", value: "c", score: 3 },
                { text: "Our retention efforts are largely reactive, and renewal processes are informal or inconsistent. We typically respond to cancellation notices rather than proactively working to prevent them.", value: "d", score: 1 },
                { text: "We don't have defined retention or renewal processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q5_owner",
            section: sectionName,
            text: "How involved is the owner in customer retention and renewal efforts?",
            type: "mcq",
            valueKey: "s2d_q5_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 6: Feedback to Product/Service Improvement ---
        {
            id: "s2d_q6_process",
            section: sectionName,
            text: "6. Feedback to Product/Service Improvement: How effectively do you incorporate customer feedback to improve your product/service offerings?",
            type: "mcq",
            valueKey: "s2d_q6_process",
            groupTitle: "REVIEWS: Feedback Integration & Improvement",
            options: [
                { text: "We have a structured system to collect, categorize, and prioritize customer feedback. This input is regularly reviewed by cross-functional teams and directly influences our product/service roadmap. We close the loop with customers when their feedback leads to changes, and measure the impact of these improvements. We systematically differentiate between promoter feedback (made public) and detractor feedback (used for internal improvement).", value: "a", score: 7 },
                { text: "We consistently gather customer feedback and have a process for reviewing and incorporating key insights. Major suggestions are evaluated for implementation, and we generally inform customers when their feedback leads to changes.", value: "b", score: 5 },
                { text: "We collect feedback but our process for review and implementation may be informal or inconsistent. Some insights lead to improvements, but we may not systematically track feedback-driven changes.", value: "c", score: 3 },
                { text: "We consider customer feedback when offered but don't actively solicit it for improvement purposes. Implementation of feedback-driven changes is ad-hoc.", value: "d", score: 1 },
                { text: "We don't have processes for incorporating customer feedback into our offerings, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q6_owner",
            section: sectionName,
            text: "How involved is the owner in the feedback review and implementation process?",
            type: "mcq",
            valueKey: "s2d_q6_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 7: Customer Advocacy and Referral Generation (Success → Lead) ---
        {
            id: "s2d_q7_process",
            section: sectionName,
            text: "7. Customer Advocacy and Referral Generation (Success → Lead): How effectively do you convert successful customers into advocates and referral sources?",
            type: "mcq",
            valueKey: "s2d_q7_process",
            groupTitle: "REFERRALS: Success to Lead Process",
            options: [
                { text: "We have a systematic advocacy program that identifies and nurtures potential advocates, makes it easy for them to refer others, and rewards referrals appropriately. We actively collect testimonials, case studies, and reviews at optimal moments tied to customer success milestones. Referral sources are tracked with attribution, and we measure the ROI of our advocacy efforts. We have built communities where advocates can engage with prospects.", value: "a", score: 7 },
                { text: "We have established processes for requesting referrals, testimonials, and reviews at key journey moments. We recognize and appreciate customers who refer others, and generally know which customers are our advocates. We track referral sources and outcomes.", value: "b", score: 5 },
                { text: "We occasionally ask for referrals or testimonials, but our approach isn't consistent or systematic. We appreciate advocates but may not have formal programs to cultivate or reward them. Referral tracking is basic.", value: "c", score: 3 },
                { text: "We rarely actively seek referrals or testimonials. Most advocacy happens organically without our direct involvement, and we don't track referral sources.", value: "d", score: 1 },
                { text: "We don't have processes for generating referrals or developing advocates, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q7_owner",
            section: sectionName,
            text: "How involved is the owner in developing customer advocates and generating referrals?",
            type: "mcq",
            valueKey: "s2d_q7_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 8: Success to Marketing Integration (Success → Market) ---
        {
            id: "s2d_q8_process",
            section: sectionName,
            text: "8. Success to Marketing Integration (Success → Market): How well do you leverage customer success stories to fuel your marketing and sales efforts?",
            type: "mcq",
            valueKey: "s2d_q8_process",
            groupTitle: "RESALE: Success to Market Process",
            options: [
                { text: "We have a systematic process for transforming customer successes into compelling marketing and sales assets. Case studies, testimonials, and success metrics are regularly collected at optimal customer journey moments, professionally produced, and strategically deployed across marketing channels and sales processes. We track which success stories drive the most leads and sales. Marketing and success teams have integrated workflows with clear handoff procedures.", value: "a", score: 7 },
                { text: "We regularly develop case studies and testimonials from successful customers. These assets are used in our marketing and sales processes, and our teams collaborate to leverage customer success stories effectively. We have some tracking of marketing attribution from success stories.", value: "b", score: 5 },
                { text: "We occasionally create success-based marketing materials, but our process isn't consistent or systematic. Marketing, sales, and success teams collaborate but may not have formal integration processes. Limited tracking of success story impact.", value: "c", score: 3 },
                { text: "We rarely transform customer successes into marketing or sales assets. Any integration between success, marketing, and sales happens informally with no systematic approach.", value: "d", score: 1 },
                { text: "We don't have processes for leveraging success stories in marketing and sales, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q8_owner",
            section: sectionName,
            text: "How involved is the owner in the success-to-marketing integration process?",
            type: "mcq",
            valueKey: "s2d_q8_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 9: Customer Journey Mapping and Milestone Management ---
        {
            id: "s2d_q9_process",
            section: sectionName,
            text: "9. Customer Journey Mapping and Milestone Management: How well do you understand and manage your customer's journey from onboarding to advocacy?",
            type: "mcq",
            valueKey: "s2d_q9_process",
            groupTitle: "CUSTOMER JOURNEY & ASCENSION POINTS",
            options: [
                { text: "We have a comprehensive customer journey map with clearly defined stages, success milestones, and ascension points where customers are most likely to provide testimonials, make referrals, or upgrade services. We have automated communications and milestone celebrations tied to journey stages. Each stage has defined success criteria and triggers for next steps.", value: "a", score: 7 },
                { text: "We have documented our customer journey with key stages and some identified milestone moments. We have basic processes for recognizing customer achievements and some automated communications based on journey stages.", value: "b", score: 5 },
                { text: "We understand our customer journey conceptually but may not have it fully documented. We recognize some key moments but don't systematically celebrate milestones or have structured communications tied to journey stages.", value: "c", score: 3 },
                { text: "Our understanding of the customer journey is informal and varies by team member. We don't have systematic approaches to milestone management or journey-based communications.", value: "d", score: 1 },
                { text: "We don't have a defined customer journey or milestone management process, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q9_owner",
            section: sectionName,
            text: "How involved is the owner in customer journey management and milestone recognition?",
            type: "mcq",
            valueKey: "s2d_q9_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- Pregunta 10: Upsell and Cross-sell Processes (Resale) ---
        {
            id: "s2d_q10_process",
            section: sectionName,
            text: "10. Upsell and Cross-sell Processes (Resale): How systematically do you identify and pursue expansion opportunities with existing customers?",
            type: "mcq",
            valueKey: "s2d_q10_process",
            groupTitle: "RESALE: Success to Market Process", // Reutiliza el groupTitle de la Q8 si es apropiado
            options: [
                { text: "We have a data-driven approach to identifying upsell and cross-sell opportunities based on customer usage patterns, success metrics, and journey stage. We have documented playbooks for different expansion scenarios, clear triggers for outreach, and track expansion revenue by customer segment. Our success team works closely with sales to identify and nurture expansion opportunities.", value: "a", score: 7 },
                { text: "We regularly identify expansion opportunities with existing customers and have some systematic approaches to upselling. We track expansion revenue and have basic processes for identifying the right timing for upsell conversations.", value: "b", score: 5 },
                { text: "We occasionally identify upsell opportunities but our approach isn't fully systematic. We may track expansion revenue but don't have sophisticated triggers or playbooks for different scenarios.", value: "c", score: 3 },
                { text: "Our expansion efforts are largely opportunistic and reactive. We don't systematically track or pursue upsell opportunities.", value: "d", score: 1 },
                { text: "We don't have defined processes for customer expansion, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q10_owner",
            section: sectionName,
            text: "How involved is the owner in identifying and pursuing expansion opportunities?",
            type: "mcq",
            valueKey: "s2d_q10_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 },
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },
    ];
};