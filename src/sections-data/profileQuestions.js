// src/sections-data/profileQuestions.js
export const getProfileQuestions = (sectionName) => {
    return [
 {
   id: "industrySector",
   section: sectionName,
   text: "Select your primary Industry Sector:",
   type: "select", valueKey: "naicsSector",
   required: true, isEssentialForVC: true
 },
 {
     id: "industrySubSector",
   section: sectionName,
    text: "Select your specific Industry Sub-Sector:",
   type: "select_dependent", dependsOn: "naicsSector", valueKey: "naicsSubSector",
    required: true, isEssentialForVC: true
 },
 {
     id: "finRev",
     section: sectionName,
     text: "What is your approximate Last Full Year Revenue?",
     type: "number", valueKey: "currentRevenue", placeholder: "e.g., $ 1,500,000",
     required: true,isEssentialForVC: true
 },
 {
    id: "profile1",
     section: sectionName,
    text: "What is your primary role in the business?",
    type: "mcq", valueKey: "ownerRole",
     options: [ { text: "CEO/President", score: 0 }, { text: "COO/GM", score: 0 }, { text: "Director/VP", score: 0 }, { text: "Manager", score: 0 }, { text: "Individual Contributor", score: 0 } ],
     required: true, isEssentialForVC: true
         },
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
 {
     id: "profile2",
     section: sectionName,
     text: "How many employees or FTE (Full-Time Equivalent) does the business have?",
     type: "number",
     valueKey: "employeeCount",
     placeholder: "e.g., 25",
     required: true, isEssentialForVC: true,
 },
 {
    id: "profile3",
    section: sectionName,
    text: "Enter your email address. This is crucial for saving your progress and receiving results.",
    type: "email", valueKey: "userEmail", placeholder: "your.email@example.com",
    required: true, isEssentialForVC: true
 },
    ];
};



