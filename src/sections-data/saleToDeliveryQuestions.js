// src/sections-data/saleToDeliveryQuestions.js

export const getSaleToDeliveryProcessQuestions = () => {
    return [
        // --- Preguntas de Definición de Producto/Servicio ---
        {
            id: "s2d_productName",
            text: "Name of Product/Service:",
            type: "text",
            valueKey: "s2d_productName",
            required: true,
        },
        {
            id: "s2d_productDescription",
            text: "Description of Product/Service:",
            type: "textarea",
            valueKey: "s2d_productDescription",
            required: true,
            rows: 4
        },
        {
            id: "s2d_productRevenue",
            text: "Annual Revenue of Product/Service:",
            type: "number", // El input será numérico, el formateo de comas es para visualización si se desea
            valueKey: "s2d_productRevenue",
            placeholder: "e.g., 500000", // Evitar comas en el placeholder de un input numérico
            required: true,
        },

        // --- 1. Contract and Payment Processing ---
        {
            id: "s2d_q1_process",
            text: "1. Contract and Payment Processing: How would you describe your contract finalization and payment processing after a sale is made?",
            type: "mcq",
            valueKey: "s2d_q1_process",
            options: [
                { text: "We have a fully automated system that generates contracts based on sale details, collects electronic signatures, processes payments, and integrates with our CRM and accounting software. The system includes automated reminders and escalation procedures for any delays.", value: "a", score: 7 },
                { text: "We have standardized contract templates and a documented process for signatures and payment collection. Most of this is digital, but it requires manual oversight and occasional intervention.", value: "b", score: 5 },
                { text: "We have basic contract templates and a somewhat consistent approach to payment collection, but the process varies depending on the client or staff member handling it.", value: "c", score: 3 },
                { text: "We handle contracts and payments on a case-by-case basis with minimal standardization. The process often depends on the individual handling it.", value: "d", score: 1 },
                { text: "We don't have a defined process for contracts and payments, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q1_owner",
            text: "How involved is the owner in the contract and payment processing?",
            type: "mcq",
            valueKey: "s2d_q1_owner",
            options: [
                { text: "Not at all / Informed only (receives updates but isn't involved in the process)", value: "a", score: 5 },
                { text: "Consulted (reviews contracts or weighs in on payment terms but doesn't handle the process)", value: "b", score: 3 },
                { text: "Accountable (must give final approval on contracts or payment terms)", value: "c", score: 1 },
                { text: "Responsible (actively creates contracts, negotiates terms, or processes payments)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 2. Internal Handoff from Sales to Delivery Team ---
        {
            id: "s2d_q2_process",
            text: "2. Internal Handoff from Sales to Delivery Team: How effectively does information transfer from your sales team to your delivery team?",
            type: "mcq",
            valueKey: "s2d_q2_process",
            options: [
                { text: "We have a comprehensive, documented handoff process with a detailed checklist. Information is automatically transferred through integrated systems, with required fields ensuring all necessary details are captured. Regular feedback loops between sales and delivery teams continuously improve the process.", value: "a", score: 7 },
                { text: "We have a structured handoff meeting with a standard form/template. Most required information is consistently transferred, though occasional clarification is needed. There's good communication between teams.", value: "b", score: 5 },
                { text: "We have basic handoff procedures, but they're not always followed consistently. Some information is often missing, requiring follow-up. Communication between teams is adequate but could be improved.", value: "c", score: 3 },
                { text: "Handoffs happen informally through conversations or emails. Information transfer is inconsistent, and delivery teams often need to circle back for missing details. There's occasional tension between teams.", value: "d", score: 1 },
                { text: "There's no formal handoff process, or I'm not sure how information transfers between sales and delivery.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q2_owner",
            text: "How involved is the owner in the sales-to-delivery handoff process?",
            type: "mcq",
            valueKey: "s2d_q2_owner",
            options: [
                { text: "Not at all / Informed only (receives updates but isn't involved in handoffs)", value: "a", score: 5 },
                { text: "Consulted (provides input on complex handoffs but doesn't participate in routine transfers)", value: "b", score: 3 },
                { text: "Accountable (oversees the handoff process and ensures it happens correctly)", value: "c", score: 1 },
                { text: "Responsible (actively participates in or facilitates handoff meetings/processes)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 3. Client Onboarding Process ---
        {
            id: "s2d_q3_process",
            text: "3. Client Onboarding Process: How would you rate your client onboarding process after a sale?",
            type: "mcq",
            valueKey: "s2d_q3_process",
            options: [
                { text: "We have a systematic, documented onboarding process with automated workflows, personalized welcome sequences, and clear milestones. Clients receive the right information at the right time, and our system tracks their progress. We regularly measure onboarding satisfaction and time-to-value metrics.", value: "a", score: 7 },
                { text: "We have a standard onboarding process with welcome emails, introduction calls, and resource sharing. The process is largely consistent and clients generally know what to expect, though some manual tracking is required.", value: "b", score: 5 },
                { text: "We have basic onboarding steps that we follow, but they aren't fully documented or consistent across all clients. Some clients receive better onboarding experiences than others.", value: "c", score: 3 },
                { text: "Our onboarding is mostly reactive and varies significantly depending on the client or staff member handling it. We address questions as they come up rather than proactively guiding clients.", value: "d", score: 1 },
                { text: "We don't have a defined onboarding process, or I'm not sure how new clients are currently onboarded.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q3_owner",
            text: "How involved is the owner in the client onboarding process?",
            type: "mcq",
            valueKey: "s2d_q3_owner",
            options: [
                { text: "Not at all / Informed only (receives updates on new clients but isn't involved in onboarding)", value: "a", score: 5 },
                { text: "Consulted (provides input on specific client needs but doesn't handle onboarding tasks)", value: "b", score: 3 },
                { text: "Accountable (oversees the onboarding process and ensures it meets standards)", value: "c", score: 1 },
                { text: "Responsible (actively conducts welcome calls, orients clients, or manages onboarding tasks)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 4. Asset and Information Collection ---
        {
            id: "s2d_q4_process",
            text: "4. Asset and Information Collection: How efficiently do you collect necessary information and assets from clients to begin delivery?",
            type: "mcq",
            valueKey: "s2d_q4_process",
            options: [
                { text: "We have automated, client-friendly intake forms and secure portals that adjust based on service type. Our system sends automated reminders and flags potential issues or missing information. We track completion rates and continuously optimize the collection process.", value: "a", score: 7 },
                { text: "We use standardized intake forms and have a consistent process for requesting and receiving client information. We follow up systematically on missing items, and most clients provide what's needed with minimal friction.", value: "b", score: 5 },
                { text: "We have basic intake forms or questionnaires, but the information collection process isn't always smooth. We often need to make multiple requests, and there's no systematic tracking of what's been received.", value: "c", score: 3 },
                { text: "We request information from clients as needed, often through email exchanges. The process is largely manual and reactive, with no standardization across clients.", value: "d", score: 1 },
                { text: "We don't have a defined process for collecting client information, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q4_owner",
            text: "How involved is the owner in collecting client information and assets?",
            type: "mcq",
            valueKey: "s2d_q4_owner",
            options: [
                { text: "Not at all / Informed only (receives updates but isn't involved in information collection)", value: "a", score: 5 },
                { text: "Consulted (provides guidance on what information is needed but doesn't handle collection)", value: "b", score: 3 },
                { text: "Accountable (reviews collected information and ensures completeness)", value: "c", score: 1 },
                { text: "Responsible (actively communicates with clients to request and collect information)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 5. Expectation Setting, Timeline and Success Metrics ---
        {
            id: "s2d_q5_process",
            text: "5. Expectation Setting, Timeline and Success Metrics: How effectively do you establish and communicate expectations, timelines, milestones, and success metrics with clients after a sale?",
            type: "mcq",
            valueKey: "s2d_q5_process",
            options: [
                { text: "We use a systematic approach to collaboratively define comprehensive success metrics and create detailed timelines with clear milestones. These are visually presented to clients, documented in our systems, automatically tracked, and regularly reviewed. Stakeholders receive proactive updates on both progress against timeline and movement toward success metrics.", value: "a", score: 7 },
                { text: "We typically define clear success metrics and create project timelines with key milestones. These are shared with clients, tracked fairly consistently, and progress is communicated regularly, though some manual effort is required.", value: "b", score: 5 },
                { text: "We establish basic success metrics and timelines, but they may not be detailed or consistently documented. Milestone tracking is inconsistent, and we don't always proactively communicate progress on both metrics and timeline to clients.", value: "c", score: 3 },
                { text: "Our success metrics and timelines are often informal or highly generalized. We rarely define specific, measurable outcomes or detailed milestones, and clients usually need to ask for status updates.", value: "d", score: 1 },
                { text: "We don't typically define success metrics or create delivery timelines with milestones, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q5_owner",
            text: "How involved is the owner in defining client expectations, timelines, and success metrics?", // Texto actualizado para el owner en la pregunta combinada
            type: "mcq",
            valueKey: "s2d_q5_owner",
            options: [
                { text: "Not at all / Informed only (receives information about established expectations but isn't involved in defining them)", value: "a", score: 5 },
                { text: "Consulted (provides input on appropriate timelines and metrics but doesn't lead the definition process)", value: "b", score: 3 },
                { text: "Accountable (reviews and approves the expectations before they're finalized with clients)", value: "c", score: 1 },
                { text: "Responsible (directly works with clients to establish and document timelines and success metrics)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 6. Scheduling and Resource Allocation ---
        {
            id: "s2d_q6_process",
            text: "6. Scheduling and Resource Allocation: How effectively do you schedule work and allocate resources after a sale?",
            type: "mcq",
            valueKey: "s2d_q6_process",
            options: [
                { text: "We have an integrated capacity planning system that optimizes resource allocation based on skills, availability, and project requirements. The system forecasts potential bottlenecks and suggests solutions. Scheduling is transparent to all stakeholders with automated notifications for any changes.", value: "a", score: 7 },
                { text: "We use a structured approach to resource planning with visibility into team capacity and upcoming work. Resources are assigned based on a clear methodology, and scheduling conflicts are usually identified and resolved proactively.", value: "b", score: 5 },
                { text: "We have basic scheduling procedures and attempt to match resources to projects appropriately, but we sometimes encounter capacity issues or misalignment of skills. Planning tends to be short-term rather than strategic.", value: "c", score: 3 },
                { text: "Resource allocation happens informally and often reactively. We frequently need to adjust schedules or reassign resources due to unforeseen conflicts or capacity issues.", value: "d", score: 1 },
                { text: "We don't have a defined process for scheduling and resource allocation, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q6_owner",
            text: "How involved is the owner in scheduling and resource allocation?",
            type: "mcq",
            valueKey: "s2d_q6_owner",
            options: [
                { text: "Not at all / Informed only (receives scheduling updates but isn't involved in resource decisions)", value: "a", score: 5 },
                { text: "Consulted (provides input on complex resource questions but doesn't make routine allocations)", value: "b", score: 3 },
                { text: "Accountable (approves resource plans and ensures adequate capacity)", value: "c", score: 1 },
                { text: "Responsible (actively schedules work and assigns resources to projects)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 7. Client Communication Plan ---
        {
            id: "s2d_q7_process",
            text: "7. Client Communication Plan: How would you describe your communication planning with clients during the transition from sale to delivery?",
            type: "mcq",
            valueKey: "s2d_q7_process",
            options: [
                { text: "We establish a detailed communication plan with each client, including preferred channels, frequency, key contacts, escalation procedures, and expected response times. This plan is documented and systematically followed, with automation supporting consistent touch points.", value: "a", score: 7 },
                { text: "We typically discuss and document communication preferences with clients and have a general framework for keeping them informed during delivery. Most team members follow these guidelines consistently.", value: "b", score: 5 },
                { text: "We have some basic communication practices, but they aren't always documented or consistently followed. Communication approaches vary depending on the team member or client.", value: "c", score: 3 },
                { text: "Client communication during delivery is largely reactive and varies significantly across clients. We don't typically establish communication expectations upfront.", value: "d", score: 1 },
                { text: "We don't have defined communication practices for the delivery phase, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q7_owner",
            text: "How involved is the owner in client communications during delivery?",
            type: "mcq",
            valueKey: "s2d_q7_owner",
            options: [
                { text: "Not at all / Informed only (receives updates on client communications but doesn't communicate directly)", value: "a", score: 5 },
                { text: "Consulted (provides input on sensitive communications but isn't the primary contact)", value: "b", score: 3 },
                { text: "Accountable (reviews important client communications and ensures standards are met)", value: "c", score: 1 },
                { text: "Responsible (serves as the primary client contact or handles most client communications)", value: "d", score: 0 }
            ],
            required: true,
        },

        // --- 8. Technology and Tools Integration ---
        {
            id: "s2d_q8_process",
            text: "8. Technology and Tools Integration: How well do your technologies and tools support the transition from sale to delivery?",
            type: "mcq",
            valueKey: "s2d_q8_process",
            options: [
                { text: "We have fully integrated systems where information flows seamlessly between sales and delivery platforms. Automation eliminates duplicate data entry and ensures all team members have access to the information they need. The system supports efficient workflows and provides real-time visibility.", value: "a", score: 7 },
                { text: "Our key systems are integrated, allowing most information to transfer effectively between sales and delivery tools. Some manual steps may be required, but the technology generally supports smooth transitions.", value: "b", score: 5 },
                { text: "We have basic tools for both sales and delivery, but they aren't well integrated. Information often needs to be manually transferred between systems, creating potential for errors or omissions.", value: "c", score: 3 },
                { text: "Our technologies are largely siloed, with limited connectivity between sales and delivery tools. Information transfer requires significant manual effort and workarounds.", value: "d", score: 1 },
                { text: "We don't have dedicated tools supporting the sale-to-delivery transition, or I'm not sure how our current technologies support this process.", value: "e", score: 0 }
            ],
            required: true,
        },
        {
            id: "s2d_q8_owner",
            text: "How involved is the owner in managing the technologies used for sale-to-delivery processes?",
            type: "mcq",
            valueKey: "s2d_q8_owner",
            options: [
                { text: "Not at all / Informed only (receives updates on systems but isn't involved in their management)", value: "a", score: 5 },
                { text: "Consulted (provides input on technology needs but doesn't maintain or administer systems)", value: "b", score: 3 },
                { text: "Accountable (approves technology investments and ensures systems meet needs)", value: "c", score: 1 },
                { text: "Responsible (selects, implements, or directly manages the sale-to-delivery technologies)", value: "d", score: 0 }
            ],
            required: true,
        },
    ];
};

