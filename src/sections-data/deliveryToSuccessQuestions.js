// src/sections-data/deliveryToSuccessQuestions.js

export const getDeliveryToSuccessQuestions = (sectionName) => {
    return [
        // --- 1. Service/Product Delivery Process ---
        {
            id: "d2s_q1_process",
            section: sectionName,
            text: "1. Service/Product Delivery Process: How would you describe your execution and quality control processes during service/product delivery?",
            type: "mcq",
            valueKey: "d2s_q1_process",
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
            id: "d2s_q1_owner",
            section: sectionName,
            text: "How involved is the owner in day-to-day service/product delivery?",
            type: "mcq",
            valueKey: "d2s_q1_owner",
            options: [
                { text: "Not at all / Informed only (receives updates but isn't involved in delivery)", value: "a", score: 5 },
                { text: "Consulted (provides guidance on complex issues but doesn't handle routine delivery)", value: "b", score: 3 },
                { text: "Accountable (oversees the delivery process and ensures quality standards)", value: "c", score: 1 },
                { text: "Responsible (actively delivers the product/service or manages daily delivery operations)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 2. Customer Success Measurement & Results Tracking --- // Cambiado el título para coincidir con la guía
        {
            id: "d2s_q2_process",
            section: sectionName,
            text: "2. Customer Success Measurement & Results Tracking: How do you measure and track whether customers are achieving their desired results?", // Texto de la guía
            type: "mcq",
            valueKey: "d2s_q2_process",
            options: [ // Opciones de la guía
                { text: "We have multiple systematic methods (e.g., NPS, CSAT, success metrics) implemented at strategic touchpoints. We analyze this data regularly, track trends, and have clear processes for addressing feedback. Success metrics are defined collaboratively with clients and monitored throughout their journey with milestone celebrations.", value: "a", score: 7 },
                { text: "We consistently gather customer feedback using a standard methodology (e.g., NPS or CSAT). We review this data periodically and generally act on significant feedback. We track some form of success metrics for clients with basic milestone recognition.", value: "b", score: 5 },
                { text: "We collect feedback inconsistently or informally. We may respond to issues raised, but don't systematically analyze trends. Success metrics are general rather than client-specific.", value: "c", score: 3 },
                { text: "We rely primarily on passive feedback (e.g., customers who volunteer complaints). We have minimal formal success measurement.", value: "d", score: 1 },
                { text: "We don't have formal customer success measurement processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "d2s_q2_owner",
            section: sectionName,
            text: "How involved is the owner in measuring and tracking customer results?", // Texto de la guía
            type: "mcq",
            valueKey: "d2s_q2_owner",
            options: [ // Opciones de la guía
                { text: "Not at all / Informed only (reviews reports but isn't involved in gathering or analyzing feedback)", value: "a", score: 5 },
                { text: "Consulted (provides input on success measurement but doesn't implement the process)", value: "b", score: 3 },
                { text: "Accountable (oversees the success measurement process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (personally gathers feedback or tracks customer success metrics)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 3. Issue Resolution and Customer Support ---
        {
            id: "d2s_q3_process",
            section: sectionName,
            text: "3. Issue Resolution and Customer Support: How effectively do you address customer issues or support requests?",
            type: "mcq",
            valueKey: "d2s_q3_process",
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
            id: "d2s_q3_owner",
            section: sectionName,
            text: "How involved is the owner in resolving customer issues?",
            type: "mcq",
            valueKey: "d2s_q3_owner",
            options: [
                { text: "Not at all / Informed only (receives updates on major issues but isn't involved in resolution)", value: "a", score: 5 },
                { text: "Consulted (provides guidance on complex issues but doesn't handle routine support)", value: "b", score: 3 },
                { text: "Accountable (oversees the support process and ensures issues are resolved)", value: "c", score: 1 },
                { text: "Responsible (directly handles customer issues or manages day-to-day support operations)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 4. Customer Success Management and Proactive Support ---
        {
            id: "d2s_q4_process",
            section: sectionName,
            // texto de la guía: "4. Customer Success Management and Proactive Support: How proactively do you manage ongoing customer relationships to ensure retention?"
            // Tu texto original es "ensure success", la guía dice "ensure retention". Usaré el de la guía.
            text: "4. Customer Success Management and Proactive Support: How proactively do you manage ongoing customer relationships to ensure retention?",
            type: "mcq",
            valueKey: "d2s_q4_process",
            options: [ // Opciones de la guía
                { text: "We have a formal customer success program with dedicated personnel, scheduled check-ins, and individualized success plans. We proactively identify opportunities to add value, address potential issues before they arise, and systematically work to improve outcomes. Usage data and success metrics are actively monitored with early warning systems for at-risk customers.", value: "a", score: 7 },
                { text: "We conduct regular check-ins with customers and have some proactive measures to ensure customer success. Key accounts have basic success plans, and we generally anticipate common needs or issues.", value: "b", score: 5 },
                { text: "We maintain communication with customers but our approach is somewhat reactive. Check-ins may happen inconsistently, and our ability to anticipate needs varies.", value: "c", score: 3 },
                { text: "Our ongoing customer management is minimal or happens only when problems arise. We primarily rely on customers to reach out when they need something.", value: "d", score: 1 },
                { text: "We don't have proactive customer success management, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "d2s_q4_owner",
            section: sectionName,
            text: "How involved is the owner in ongoing customer success management?",
            type: "mcq",
            valueKey: "d2s_q4_owner",
            options: [
                { text: "Not at all / Informed only (receives updates on customer status but isn't involved in management)", value: "a", score: 5 },
                { text: "Consulted (provides input on success strategies but doesn't manage customer relationships)", value: "b", score: 3 },
                { text: "Accountable (oversees the success management process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (directly manages key customer relationships or oversees day-to-day success operations)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 5. Retention and Renewal Processes ---
        {
            id: "d2s_q5_process",
            section: sectionName,
            text: "5. Retention and Renewal Processes: How systematic are your processes for retaining customers and securing renewals or repeat business?",
            type: "mcq",
            valueKey: "d2s_q5_process",
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
            id: "d2s_q5_owner",
            section: sectionName,
            text: "How involved is the owner in customer retention and renewal efforts?",
            type: "mcq",
            valueKey: "d2s_q5_owner",
            options: [
                { text: "Not at all / Informed only (receives retention reports but isn't involved in retention activities)", value: "a", score: 5 },
                { text: "Consulted (provides input on retention strategies but doesn't implement them)", value: "b", score: 3 },
                { text: "Accountable (oversees the retention process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (directly handles key renewals or manages day-to-day retention activities)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 6. Feedback to Product/Service Improvement --- // Título de la guía para Q6
        {
            id: "d2s_q6_process",
            section: sectionName,
            text: "6. Feedback to Product/Service Improvement: How effectively do you incorporate customer feedback to improve your product/service offerings?", // Texto de la guía para Q6
            type: "mcq",
            valueKey: "d2s_q6_process",
            options: [ // Opciones de la guía para Q6
                { text: "We have a structured system to collect, categorize, and prioritize customer feedback. This input is regularly reviewed by cross-functional teams and directly influences our product/service roadmap. We close the loop with customers when their feedback leads to changes, and measure the impact of these improvements. We systematically differentiate between promoter feedback (made public) and detractor feedback (used for internal improvement).", value: "a", score: 7 },
                { text: "We consistently gather customer feedback and have a process for reviewing and incorporating key insights. Major suggestions are evaluated for implementation, and we generally inform customers when their feedback leads to changes.", value: "b", score: 5 },
                { text: "We collect feedback but our process for review and implementation may be informal or inconsistent. Some insights lead to improvements, but we may not systematically track feedback-driven changes.", value: "c", score: 3 },
                { text: "We consider customer feedback when offered but don't actively solicit it for improvement purposes. Implementation of feedback-driven changes is ad-hoc.", value: "d", score: 1 },
                { text: "We don't have processes for incorporating customer feedback into our offerings, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "d2s_q6_owner",
            section: sectionName,
            text: "How involved is the owner in the feedback review and implementation process?", // Texto de la guía para Q6 owner
            type: "mcq",
            valueKey: "d2s_q6_owner",
            options: [ // Opciones de la guía para Q6 owner
                { text: "Not at all / Informed only (receives feedback summaries but isn't involved in review or implementation)", value: "a", score: 5 },
                { text: "Consulted (provides input on which feedback to implement but doesn't manage the process)", value: "b", score: 3 },
                { text: "Accountable (oversees the feedback implementation process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (directly reviews feedback or makes implementation decisions)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 7. Customer Advocacy and Referral Generation (Success → Lead) --- // Título de la guía para Q7
        {
            id: "d2s_q7_process",
            section: sectionName,
            text: "7. Customer Advocacy and Referral Generation (Success → Lead): How effectively do you convert successful customers into advocates and referral sources?", // Texto de la guía para Q7
            type: "mcq",
            valueKey: "d2s_q7_process",
            options: [ // Opciones de la guía para Q7
                { text: "We have a systematic advocacy program that identifies and nurtures potential advocates, makes it easy for them to refer others, and rewards referrals appropriately. We actively collect testimonials, case studies, and reviews at optimal moments tied to customer success milestones. Referral sources are tracked with attribution, and we measure the ROI of our advocacy efforts. We have built communities where advocates can engage with prospects.", value: "a", score: 7 },
                { text: "We have established processes for requesting referrals, testimonials, and reviews at key journey moments. We recognize and appreciate customers who refer others, and generally know which customers are our advocates. We track referral sources and outcomes.", value: "b", score: 5 },
                { text: "We occasionally ask for referrals or testimonials, but our approach isn't consistent or systematic. We appreciate advocates but may not have formal programs to cultivate or reward them. Referral tracking is basic.", value: "c", score: 3 },
                { text: "We rarely actively seek referrals or testimonials. Most advocacy happens organically without our direct involvement, and we don't track referral sources.", value: "d", score: 1 },
                { text: "We don't have processes for generating referrals or developing advocates, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "d2s_q7_owner",
            section: sectionName,
            text: "How involved is the owner in developing customer advocates and generating referrals?", // Texto de la guía para Q7 owner
            type: "mcq",
            valueKey: "d2s_q7_owner",
            options: [ // Opciones de la guía para Q7 owner
                { text: "Not at all / Informed only (receives reports but isn't involved in advocacy development)", value: "a", score: 5 },
                { text: "Consulted (provides input on advocacy strategies but doesn't implement them)", value: "b", score: 3 },
                { text: "Accountable (oversees the advocacy process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (directly solicits referrals or manages advocacy development)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 8. Success to Marketing Integration (Success → Market) --- // Título de la guía para Q8
        {
            id: "d2s_q8_process",
            section: sectionName,
            text: "8. Success to Marketing Integration (Success → Market): How well do you leverage customer success stories to fuel your marketing and sales efforts?", // Texto de la guía para Q8
            type: "mcq",
            valueKey: "d2s_q8_process",
            options: [ // Opciones de la guía para Q8
                { text: "We have a systematic process for transforming customer successes into compelling marketing and sales assets. Case studies, testimonials, and success metrics are regularly collected at optimal customer journey moments, professionally produced, and strategically deployed across marketing channels and sales processes. We track which success stories drive the most leads and sales. Marketing and success teams have integrated workflows with clear handoff procedures.", value: "a", score: 7 },
                { text: "We regularly develop case studies and testimonials from successful customers. These assets are used in our marketing and sales processes, and our teams collaborate to leverage customer success stories effectively. We have some tracking of marketing attribution from success stories.", value: "b", score: 5 },
                { text: "We occasionally create success-based marketing materials, but our process isn't consistent or systematic. Marketing, sales, and success teams collaborate but may not have formal integration processes. Limited tracking of success story impact.", value: "c", score: 3 },
                { text: "We rarely transform customer successes into marketing or sales assets. Any integration between success, marketing, and sales happens informally with no systematic approach.", value: "d", score: 1 },
                { text: "We don't have processes for leveraging success stories in marketing and sales, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "d2s_q8_owner",
            section: sectionName,
            text: "How involved is the owner in the success-to-marketing integration process?", // Texto de la guía para Q8 owner
            type: "mcq",
            valueKey: "d2s_q8_owner",
            options: [ // Opciones de la guía para Q8 owner
                { text: "Not at all / Informed only (reviews final case studies but isn't involved in their creation or deployment)", value: "a", score: 5 },
                { text: "Consulted (provides input on which success stories to highlight but doesn't manage the process)", value: "b", score: 3 },
                { text: "Accountable (oversees the integration process and ensures it happens)", value: "c", score: 1 },
                { text: "Responsible (directly creates case studies or manages integration activities)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 9. Customer Journey Mapping and Milestone Management --- // NUEVA PREGUNTA Q9
        {
            id: "d2s_q9_process",
            section: sectionName,
            text: "9. Customer Journey Mapping and Milestone Management: How well do you understand and manage your customer's journey from onboarding to advocacy?",
            type: "mcq",
            valueKey: "d2s_q9_process",
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
            id: "d2s_q9_owner",
            section: sectionName,
            text: "How involved is the owner in customer journey management and milestone recognition?",
            type: "mcq",
            valueKey: "d2s_q9_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 }, // Simplificado como en la guía
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 10. Upsell and Cross-sell Processes (Resale) --- // NUEVA PREGUNTA Q10
        {
            id: "d2s_q10_process",
            section: sectionName,
            text: "10. Upsell and Cross-sell Processes (Resale): How systematically do you identify and pursue expansion opportunities with existing customers?",
            type: "mcq",
            valueKey: "d2s_q10_process",
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
            id: "d2s_q10_owner",
            section: sectionName,
            text: "How involved is the owner in identifying and pursuing expansion opportunities?",
            type: "mcq",
            valueKey: "d2s_q10_owner",
            options: [
                { text: "Not at all / Informed only", value: "a", score: 5 }, // Simplificado como en la guía
                { text: "Consulted", value: "b", score: 3 },
                { text: "Accountable", value: "c", score: 1 },
                { text: "Responsible", value: "d", score: 0 }
            ],
            required: true,
        },
    ];
};