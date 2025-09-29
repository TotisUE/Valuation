// src/sections-data/profileQuestions.js

export const getProfileQuestions = (sectionName) => {
    return [
      // --- Preguntas que se mantienen ---
      {
        id: "industrySector",
        section: sectionName,
        text: "Select your primary Industry Sector:",
        type: "select",
        valueKey: "naicsSector",
        required: true
      },
      {
        id: "industrySubSector",
        section: sectionName,
        text: "Select your specific Industry Sub-Sector:",
        type: "select_dependent",
        dependsOn: "naicsSector",
        valueKey: "naicsSubSector",
        required: true
      },
      {
        id: "finRev",
        section: sectionName,
        text: "What is your approximate Last Full Year Revenue?",
        type: "number",
        valueKey: "currentRevenue",
        placeholder: "e.g., $ 1,500,000",
        required: true
      },
  
      // --- Pregunta de Empleados (Modificada a MCQ) ---
      {
        id: "employeeCount",
        section: sectionName,
        text: "Approximately how many full-time equivalent (FTE) employees does the business currently have?",
        type: "mcq",
        valueKey: "employeeCountRange",
        options: [
          { text: "1-5 FTEs", value: "1-5 FTEs", score: 0 },
          { text: "6-15 FTEs", value: "6-15 FTEs", score: 0 },
          { text: "16-30 FTEs", value: "16-30 FTEs", score: 0 },
          { text: "31-50 FTEs", value: "31-50 FTEs", score: 0 },
          { text: "51-100 FTEs", value: "51-100 FTEs", score: 0 },
          { text: "100+ FTEs", value: "100+ FTEs", score: 0 },
        ],
        required: true
      },
  
      // --- Nuevas Preguntas de Ubicación ---
      {
        id: "locationState",
        section: sectionName,
        text: "In which State is the business primarily located/headquartered?",
        type: "text",
        valueKey: "locationState",
        placeholder: "e.g., Texas",
        required: true
      },
      {
        id: "locationZip",
        section: sectionName,
        text: "What is the primary Zip Code?",
        type: "text",
        valueKey: "locationZip",
        placeholder: "e.g., 78701",
        required: true
      },
  
      // --- Nuevas Preguntas de Modelo de Negocio ---
      {
        id: "revenueSourceBalance",
        section: sectionName,
        text: "How do you generate most of your revenue? Do you primarily sell directly to the end customer (the person or company that owns/uses the asset and pays you directly), or do you sell through intermediaries such as contractors, agencies, or resellers, distributors?",
        type: "mcq",
        valueKey: "revenueSourceBalance",
        options: [
          { text: "Mostly/All Direct (>80% Direct Revenue)", score: 0 },
          { text: "Primarily Direct (approx. 60-80% Direct Revenue)", score: 0 },
          { text: "Roughly Balanced Mix (approx. 40-60% Direct Revenue)", score: 0 },
          { text: "Primarily Intermediary (approx. 20-40% Direct Revenue)", score: 0 },
          { text: "Mostly/All Intermediary (<20% Direct Revenue)", score: 0 },
        ],
        required: true
      },
      {
        id: "customerTypeBalance",
        section: sectionName,
        text: "Estimate the percentage of your revenue coming from Business customers (B2B) versus Individual Consumers (B2C):",
        type: "mcq",
        valueKey: "customerTypeBalance",
        options: [
          { text: "Mostly/All Businesses (>80% B2B Revenue)", score: 0 },
          { text: "Primarily Businesses (approx. 60-80% B2B Revenue)", score: 0 },
          { text: "Roughly Balanced Mix (approx. 40-60% B2B Revenue)", score: 0 },
          { text: "Primarily Consumers (approx. 20-40% B2B Revenue)", score: 0 },
          { text: "Mostly/All Consumers (<20% B2B Revenue)", score: 0 },
        ],
        required: true
      },
      
      // --- Pregunta de Rol (Opciones Modificadas) ---
      {
        id: "ownerRole",
        section: sectionName,
        text: "What is your primary role in the business?",
        type: "mcq",
        valueKey: "ownerRole",
        options: [
          { text: "Owner/Founder", score: 0 },
          { text: "CEO", score: 0 },
          { text: "Managing Partner", score: 0 },
          { text: "Investor", score: 0 },
          { text: "Other", score: 0 },
        ],
        required: true
      },
  
      // --- Nueva Pregunta de Involucramiento ---
      {
        id: "yearsInvolved",
        section: sectionName,
        text: "How long have you been involved with this business?",
        type: "mcq",
        valueKey: "yearsInvolved",
        options: [
          { text: "Less than 1 year", score: 0 },
          { text: "1-3 years", score: 0 },
          { text: "4-7 years", score: 0 },
          { text: "8-15 years", score: 0 },
          { text: "Over 15 years", score: 0 },
        ],
        required: true
      },
      
      // --- Pregunta de Email (se mantiene al final) ---
      {
        id: "userEmail",
        section: sectionName,
        text: "Enter your email address. This is crucial for saving your progress and receiving results.",
        type: "email",
        valueKey: "userEmail",
        placeholder: "your.email@example.com",
        required: true
      },
    ];
  };