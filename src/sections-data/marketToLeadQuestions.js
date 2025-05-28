// src/sections-data/marketToLeadQuestions.js

export const MARKETING_CHANNELS_OPTIONS = [
    { value: '', text: 'Please select a primary channel...' }, // Placeholder mejorado
    { value: 'meta_ads', text: 'Meta (Facebook/Instagram Ads)' },
    { value: 'tiktok_ads', text: 'TikTok Ads' },
    { value: 'google_ads', text: 'Google Ads' },
    { value: 'linkedin_ads', text: 'LinkedIn Ads' },
    { value: 'youtube_ads', text: 'YouTube Ads' },
    { value: 'youtube_organic', text: 'YouTube Organic' },
    { value: 'linkedin_organic', text: 'LinkedIn Organic' },
    { value: 'google_seo', text: 'Google SEO' },
    { value: 'instagram_organic', text: 'Instagram Organic' },
    { value: 'email_marketing', text: 'Email Marketing' },
    { value: 'text_sms_marketing', text: 'Text/SMS Marketing' },
    { value: 'referral_programs', text: 'Referral Programs' },
    { value: 'other_paid_channels', text: 'Other Paid Channels (Listed Below)' },
    { value: 'other_organic_channels', text: 'Other Organic Channels (Listed Below)' },
];

const createChannelQuestions = (channelKey, channelDisplayName, channelType, sectionName, includeSpend = true) => {
    const questions = [
        {
            id: `m2l_${channelKey}_use`, section: sectionName,
            text: `Do you use ${channelDisplayName}?`, type: 'select', valueKey: `m2l_${channelKey}_use`,
            options: [ { value: '', text: 'Please select...' }, { value: 'yes', text: 'Yes' }, { value: 'no', text: 'No' } ], // Placeholder mejorado
            required: true, 
        },
        {
            id: `m2l_${channelKey}_customerPercent`, section: sectionName,
            text: `% of customers from ${channelDisplayName}:`, type: 'number', valueKey: `m2l_${channelKey}_customerPercent`,
            placeholder: "e.g., 25", min: 0, max: 100, helpText: "Enter a number (0-100) for percentage."
        }
    ];

    if (includeSpend) {
        questions.push({
            id: `m2l_${channelKey}_monthlySpend`, section: sectionName,
            text: `Monthly spend for ${channelDisplayName}:`, type: 'number', valueKey: `m2l_${channelKey}_monthlySpend`,
            placeholder: "e.g., 500", min: 0, helpText: "Enter amount in $."
        });
    }

    let warmTrafficText = `% of traffic that is "warm" (retargeting, lookalikes) for ${channelDisplayName}:`;
    if (channelType === 'organic') {
        if (channelKey === 'google_seo') warmTrafficText = `% of traffic from ${channelDisplayName} that is "warm" (e.g., branded searches):`;
        else warmTrafficText = `% of traffic from ${channelDisplayName} that is "warm" (e.g., your subscribers/returning viewers):`;
    } else if (channelType === 'direct') {
        warmTrafficText = `% of ${channelKey === 'email_marketing' ? 'emails' : 'texts'} to "warm" audiences (your lists vs. cold outreach) for ${channelDisplayName}:`;
    } else if (channelType === 'referral') { // Esta condición para referral en createChannelQuestions no se usará si referral es manual
        warmTrafficText = `% from internal referrals vs. external partners for ${channelDisplayName}:`;
    }
    
    questions.push({
        id: `m2l_${channelKey}_warmTrafficPercent`, section: sectionName, text: warmTrafficText,
        type: 'number', valueKey: `m2l_${channelKey}_warmTrafficPercent`, placeholder: "e.g., 60",
        min: 0, max: 100, helpText: "Enter a number (0-100) for percentage."
    });
    
    return questions;
};

// --- PREGUNTAS PARA MARKET TO LEAD - PARTE 1: Channels & Economics ---
export const getMarketToLeadPart1Questions = (sectionName) => {
    const part1Questions = [
        // --- Definición de Producto/Servicio Principal ---
        {
            id: "m2l_productName", section: sectionName, text: "Name of Product/Service you are primarily marketing:",
            type: "text", valueKey: "m2l_productName", required: true, placeholder: "e.g., Our Premium Widget Model X"
        },
        {
            id: "m2l_productDescription", section: sectionName, text: "Brief Description of this Product/Service:",
            type: "textarea", valueKey: "m2l_productDescription", required: true, rows: 3, placeholder: "Describe what it is and its main benefit."
        },
        {
            id: "m2l_productRevenue", section: sectionName, text: "Approximate Annual Revenue of this Product/Service:",
            type: "number", valueKey: "m2l_productRevenue", placeholder: "e.g., 250000", required: true, helpText: "Enter numbers only, without commas or currency symbols."
        },
        {
            id: "m2l_primaryMarketingChannel", section: sectionName, text: "Primary Marketing Channel for this Product/Service:",
            type: "select", valueKey: "m2l_primaryMarketingChannel", options: MARKETING_CHANNELS_OPTIONS, required: true,
        },

        // === Channel Performance & Investment Analysis ===
        // -- Paid Advertising Channels --
        ...createChannelQuestions('meta_ads', 'Meta (Facebook/Instagram Ads)', 'paid', sectionName),
        ...createChannelQuestions('tiktok_ads', 'TikTok Ads', 'paid', sectionName),
        ...createChannelQuestions('google_ads', 'Google Ads', 'paid', sectionName),
        ...createChannelQuestions('linkedin_ads', 'LinkedIn Ads', 'paid', sectionName),
        ...createChannelQuestions('youtube_ads', 'YouTube Ads', 'paid', sectionName),
        {
            id: "m2l_otherPaidChannels_list", section: sectionName,
            text: "List any other paid channels you use (e.g., Bing, Twitter/X, Amazon, Pinterest, Reddit, LSA):",
            type: "text", valueKey: "m2l_otherPaidChannels_list",
        },
        {
            id: "m2l_otherPaidChannels_customerPercent", section: sectionName,
            text: "Combined % of customers from these 'Other Paid Channels':",
            type: "number", valueKey: "m2l_otherPaidChannels_customerPercent", min: 0, max: 100, placeholder: "e.g., 5"
        },
        {
            id: "m2l_otherPaidChannels_monthlySpend", section: sectionName,
            text: "Combined monthly spend for these 'Other Paid Channels':",
            type: "number", valueKey: "m2l_otherPaidChannels_monthlySpend", min: 0, placeholder: "e.g., 200"
        },

        // -- Content/Organic Channels --
        ...createChannelQuestions('youtube_organic', 'YouTube Organic', 'organic', sectionName, false),
        ...createChannelQuestions('linkedin_organic', 'LinkedIn Organic', 'organic', sectionName, false),
        ...createChannelQuestions('google_seo', 'Google SEO', 'organic', sectionName, false),
        ...createChannelQuestions('instagram_organic', 'Instagram Organic', 'organic', sectionName, false),
        {
            id: "m2l_otherOrganicChannels_list", section: sectionName,
            text: "List any other organic channels (e.g., TikTok, Reddit, Pinterest, Facebook Page, Google Business Profile, Referral websites):",
            type: "text", valueKey: "m2l_otherOrganicChannels_list",
        },
        {
            id: "m2l_otherOrganicChannels_customerPercent", section: sectionName,
            text: "Combined % of customers from these 'Other Organic Channels':",
            type: "number", valueKey: "m2l_otherOrganicChannels_customerPercent", min: 0, max: 100, placeholder: "e.g., 10"
        },
        
        // -- Direct Outreach --
        ...createChannelQuestions('email_marketing', 'Email Marketing', 'direct', sectionName, false),
        ...createChannelQuestions('text_sms_marketing', 'Text/SMS Marketing', 'direct', sectionName, false),

        // -- Affiliate/Referral Programs --
        {
            id: "m2l_referral_formal_programs", section: sectionName,
            text: "Do you have formal referral programs?", type: "select", valueKey: "m2l_referral_formal_programs",
            options: [ { value: '', text: 'Please select...' },{ value: 'yes', text: 'Yes' },{ value: 'no', text: 'No' } ], required: true,
        },
        {
            id: "m2l_referral_customerPercent", section: sectionName, text: "% of customers from referrals:",
            type: "number", valueKey: "m2l_referral_customerPercent", min: 0, max: 100, placeholder: "e.g., 15"
        },
        {
            id: "m2l_referral_internalExternalPercent", section: sectionName,
            text: "% of referrals from internal sources (vs. external partners):",
            type: "number", valueKey: "m2l_referral_internalExternalPercent", min: 0, max: 100, placeholder: "e.g., 70 (for 70% internal)"
        },

        // === Unit Economics Analysis ===
        {
            id: "m2l_unit_overallCAC", section: sectionName, text: "What is your overall blended CAC across all channels?",
            type: "number", valueKey: "m2l_unit_overallCAC", placeholder: "e.g., 150", helpText: "Enter amount in $."
        },
        {
            id: "m2l_unit_primaryChannelCAC", section: sectionName, text: "What is your CAC for your primary marketing channel?",
            type: "number", valueKey: "m2l_unit_primaryChannelCAC", placeholder: "e.g., 100", helpText: "Enter amount in $."
        },
        {
            id: "m2l_unit_trackCACByChannel", section: sectionName, text: "Do you track CAC by individual channel?",
            type: "select", valueKey: "m2l_unit_trackCACByChannel", 
            options: [ {value: '', text: 'Please select...'}, {value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}, {value: 'somewhat', text: 'Somewhat'}], required: true,
        },
        {
            id: "m2l_unit_90DayGrossProfit", section: sectionName, text: "What is the gross profit from a typical customer in their first 90 days?",
            type: "number", valueKey: "m2l_unit_90DayGrossProfit", placeholder: "e.g., 300", helpText: "Enter amount in $."
        },
        {
            id: "m2l_unit_track90DayValue", section: sectionName, text: "Do you track this 90-day customer value metric consistently?",
            type: "select", valueKey: "m2l_unit_track90DayValue", 
            options: [ {value: '', text: 'Please select...'}, {value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}, {value: 'somewhat', text: 'Somewhat'}], required: true,
        },
        {
            id: "m2l_unit_monthlyAcqFixedCosts", section: sectionName, text: "What are your monthly fixed costs for customer acquisition (marketing team, tools, overhead)?",
            type: "number", valueKey: "m2l_unit_monthlyAcqFixedCosts", placeholder: "e.g., 5000", helpText: "Enter amount in $."
        },
        {
            id: "m2l_unit_salesForAcqBreakeven", section: sectionName, text: "How many sales do you need monthly to cover these customer acquisition costs?",
            type: "number", valueKey: "m2l_unit_salesForAcqBreakeven", placeholder: "e.g., 50"
        },
        {
            id: "m2l_unit_totalMonthlyFixedCosts", section: sectionName, text: "What are your total monthly fixed costs for this product/service?",
            type: "number", valueKey: "m2l_unit_totalMonthlyFixedCosts", placeholder: "e.g., 10000", helpText: "Enter amount in $."
        },
        {
            id: "m2l_unit_salesForOverallProfitability", section: sectionName, text: "How many sales do you need monthly for overall profitability for this product/service?",
            type: "number", valueKey: "m2l_unit_salesForOverallProfitability", placeholder: "e.g., 100"
        },
    ];
    return part1Questions;
};

// --- PREGUNTAS PARA MARKET TO LEAD - PARTE 2: Process Assessment ---
export const getMarketToLeadPart2Questions = (sectionName) => {
    const part2Questions = [
        // === Process Assessment Questions (1-14) ===
        // 1. Market Research & ICP
        {
            id: "m2l_pa_1_marketResearchICP_process", section: sectionName,
            text: "1. Market Research & Ideal Customer Profile (ICP) Definition: How well-defined and validated is your ideal customer profile and market positioning?",
            type: "mcq", valueKey: "m2l_pa_1_marketResearchICP_process",
            options: [
                { text: "We have a comprehensive, data-driven ICP...", value: "a", score: 7 }, { text: "We have a solid ICP...", value: "b", score: 5 },
                { text: "We have a basic understanding...", value: "c", score: 3 }, { text: "We have a general idea...", value: "d", score: 1 },
                { text: "We don't have a clearly defined ICP...", value: "e", score: 0 }
            ], required: true, helpText: "Consulting: Consider client industry... Manufacturing: Focus on customer industry... Retail: Think about customer demographics... Construction: Consider project types..."
        },
        {
            id: "m2l_pa_1_marketResearchICP_owner", section: sectionName, text: "How involved is the owner in market research and ICP development?",
            type: "mcq", valueKey: "m2l_pa_1_marketResearchICP_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 2. Brand Positioning & Messaging
        {
            id: "m2l_pa_2_brandPositioning_process", section: sectionName, text: "2. Brand Positioning & Messaging Strategy: How clear and differentiated is your brand positioning in the marketplace?",
            type: "mcq", valueKey: "m2l_pa_2_brandPositioning_process",
            options: [
                { text: "We have a compelling, differentiated brand position...", value: "a", score: 7 }, { text: "We have clear brand positioning...", value: "b", score: 5 },
                { text: "We have basic brand positioning...", value: "c", score: 3 }, { text: "Our brand positioning is unclear or generic.", value: "d", score: 1 },
                { text: "We don't have defined brand positioning...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_2_brandPositioning_owner", section: sectionName, text: "How involved is the owner in brand positioning and messaging?",
            type: "mcq", valueKey: "m2l_pa_2_brandPositioning_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 3. Content Strategy
        {
            id: "m2l_pa_3_contentStrategy_process", section: sectionName, text: "3. Content Strategy & Development: How systematic and effective is your content creation and distribution strategy?",
            type: "mcq", valueKey: "m2l_pa_3_contentStrategy_process",
            options: [
                { text: "We have a comprehensive content strategy...", value: "a", score: 7 }, { text: "We create content regularly with a general strategy...", value: "b", score: 5 },
                { text: "We create content somewhat regularly...", value: "c", score: 3 }, { text: "Content creation is ad-hoc and reactive.", value: "d", score: 1 },
                { text: "We don't have a content strategy...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_3_contentStrategy_owner", section: sectionName, text: "How involved is the owner in content strategy and creation?",
            type: "mcq", valueKey: "m2l_pa_3_contentStrategy_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 4. Lead Generation & Capture
        {
            id: "m2l_pa_4_leadGenCapture_process", section: sectionName, text: "4. Lead Generation & Capture Systems: How effective are your systems for converting traffic into qualified leads?",
            type: "mcq", valueKey: "m2l_pa_4_leadGenCapture_process",
            options: [
                { text: "We have sophisticated lead generation systems...", value: "a", score: 7 }, { text: "We have solid lead generation processes...", value: "b", score: 5 },
                { text: "We have basic lead capture mechanisms...", value: "c", score: 3 }, { text: "Our lead generation is basic...", value: "d", score: 1 },
                { text: "We don't have systematic lead generation processes...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_4_leadGenCapture_owner", section: sectionName, text: "How involved is the owner in lead generation system management?",
            type: "mcq", valueKey: "m2l_pa_4_leadGenCapture_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 5. Marketing Automation & Nurturing
        {
            id: "m2l_pa_5_marketingAutomation_process", section: sectionName, text: "5. Marketing Automation & Nurturing: How sophisticated are your marketing automation and lead nurturing systems?",
            type: "mcq", valueKey: "m2l_pa_5_marketingAutomation_process",
            options: [
                { text: "We have comprehensive marketing automation...", value: "a", score: 7 }, { text: "We have solid marketing automation...", value: "b", score: 5 },
                { text: "We have basic email automation...", value: "c", score: 3 }, { text: "Our marketing automation is minimal...", value: "d", score: 1 },
                { text: "We don't have marketing automation...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_5_marketingAutomation_owner", section: sectionName, text: "How involved is the owner in marketing automation management?",
            type: "mcq", valueKey: "m2l_pa_5_marketingAutomation_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 6. Paid Media Strategy
        {
            id: "m2l_pa_6_paidMedia_process", section: sectionName, text: "6. Paid Media Strategy & Optimization: How strategic and data-driven is your approach to paid advertising?",
            type: "mcq", valueKey: "m2l_pa_6_paidMedia_process",
            options: [
                { text: "We have a comprehensive paid media strategy...", value: "a", score: 7 }, { text: "We have a solid paid media approach...", value: "b", score: 5 },
                { text: "We run paid campaigns with basic tracking...", value: "c", score: 3 }, { text: "Our paid media efforts are basic...", value: "d", score: 1 },
                { text: "We don't run paid advertising...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_6_paidMedia_owner", section: sectionName, text: "How involved is the owner in paid media strategy and management?",
            type: "mcq", valueKey: "m2l_pa_6_paidMedia_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 7. Performance Analytics & Attribution
        {
            id: "m2l_pa_7_analyticsAttribution_process", section: sectionName, text: "7. Performance Analytics & Attribution: How comprehensive is your marketing measurement and attribution system?",
            type: "mcq", valueKey: "m2l_pa_7_analyticsAttribution_process",
            options: [
                { text: "We have sophisticated attribution modeling...", value: "a", score: 7 }, { text: "We have solid analytics systems...", value: "b", score: 5 },
                { text: "We track basic marketing metrics...", value: "c", score: 3 }, { text: "Our measurement capabilities are basic...", value: "d", score: 1 },
                { text: "We don't have comprehensive marketing measurement systems...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_7_analyticsAttribution_owner", section: sectionName, text: "How involved is the owner in marketing analytics and performance review?",
            type: "mcq", valueKey: "m2l_pa_7_analyticsAttribution_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 8. Customer Journey Optimization
        {
            id: "m2l_pa_8_customerJourney_process", section: sectionName, text: "8. Customer Journey Optimization: How well do you understand and optimize the complete customer journey from awareness to purchase?",
            type: "mcq", valueKey: "m2l_pa_8_customerJourney_process",
            options: [
                { text: "We have mapped the complete customer journey...", value: "a", score: 7 }, { text: "We understand the key stages of our customer journey...", value: "b", score: 5 },
                { text: "We have basic understanding of our customer journey...", value: "c", score: 3 }, { text: "Our customer journey understanding is limited...", value: "d", score: 1 },
                { text: "We haven't mapped our customer journey...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_8_customerJourney_owner", section: sectionName, text: "How involved is the owner in customer journey mapping and optimization?",
            type: "mcq", valueKey: "m2l_pa_8_customerJourney_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
         // 9. Competitive Analysis & Market Intelligence
        {
            id: "m2l_pa_9_competitiveAnalysis_process", section: sectionName,
            text: "9. Competitive Analysis & Market Intelligence: How systematic is your approach to competitive analysis and market intelligence?",
            type: "mcq", valueKey: "m2l_pa_9_competitiveAnalysis_process",
            options: [
                { text: "We conduct comprehensive competitive analysis...", value: "a", score: 7 }, { text: "We regularly monitor key competitors...", value: "b", score: 5 },
                { text: "We have basic awareness of our competitive landscape...", value: "c", score: 3 }, { text: "Our competitive analysis is limited...", value: "d", score: 1 },
                { text: "We don't conduct systematic competitive analysis...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_9_competitiveAnalysis_owner", section: sectionName, text: "How involved is the owner in competitive analysis and market intelligence?",
            type: "mcq", valueKey: "m2l_pa_9_competitiveAnalysis_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 10. Marketing Technology Stack Integration
        {
            id: "m2l_pa_10_martech_process", section: sectionName, text: "10. Marketing Technology Stack Integration: How well-integrated and optimized is your marketing technology ecosystem?",
            type: "mcq", valueKey: "m2l_pa_10_martech_process",
            options: [
                { text: "We have a fully integrated marketing technology stack...", value: "a", score: 7 }, { text: "Our key marketing technologies are well-integrated...", value: "b", score: 5 },
                { text: "We have basic integration between key marketing tools...", value: "c", score: 3 }, { text: "Our marketing tools are largely disconnected...", value: "d", score: 1 },
                { text: "We don't have integrated marketing technology systems...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_10_martech_owner", section: sectionName, text: "How involved is the owner in marketing technology selection and management?",
            type: "mcq", valueKey: "m2l_pa_10_martech_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 11. Team & Resource Management
        {
            id: "m2l_pa_11_teamResource_process", section: sectionName, text: "11. Team & Resource Management: How effectively organized and managed are your marketing team and resources?",
            type: "mcq", valueKey: "m2l_pa_11_teamResource_process",
            options: [
                { text: "We have a well-structured marketing team...", value: "a", score: 7 }, { text: "Our marketing team is generally well-organized...", value: "b", score: 5 },
                { text: "We have basic team structure...", value: "c", score: 3 }, { text: "Our marketing team organization is informal...", value: "d", score: 1 },
                { text: "We don't have organized marketing team structure...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_11_teamResource_owner", section: sectionName, text: "How involved is the owner in marketing team management and resource allocation?",
            type: "mcq", valueKey: "m2l_pa_11_teamResource_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 12. Budget Planning & ROI Management
        {
            id: "m2l_pa_12_budgetROI_process", section: sectionName, text: "12. Budget Planning & ROI Management: How strategic and data-driven is your marketing budget planning and ROI management?",
            type: "mcq", valueKey: "m2l_pa_12_budgetROI_process",
            options: [
                { text: "We have comprehensive budget planning...", value: "a", score: 7 }, { text: "We have solid budget planning processes...", value: "b", score: 5 },
                { text: "We have basic budget planning...", value: "c", score: 3 }, { text: "Our budget planning is basic...", value: "d", score: 1 },
                { text: "We don't have systematic budget planning...", value: "e", score: 0 }
            ], required: true,
        },
        {
            id: "m2l_pa_12_budgetROI_owner", section: sectionName, text: "How involved is the owner in marketing budget planning and ROI management?",
            type: "mcq", valueKey: "m2l_pa_12_budgetROI_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 13. Competitive Positioning & Differentiation
        {
            id: "m2l_pa_13_competitivePositioning_process", section: sectionName,
            text: "13. Competitive Positioning & Differentiation: How clearly differentiated is your business from direct competitors?",
            type: "mcq", valueKey: "m2l_pa_13_competitivePositioning_process",
            options: [
                { text: "We have achieved \"category of one\" status...", value: "a", score: 7 }, { text: "We are clearly differentiated from competitors...", value: "b", score: 5 },
                { text: "We have some differentiation from competitors...", value: "c", score: 3 }, { text: "Our differentiation is minimal...", value: "d", score: 1 },
                { text: "We struggle to differentiate ourselves...", value: "e", score: 0 }
            ], required: true, helpText: "Consulting: Consider your methodology... Manufacturing: Focus on product features... Retail: Think about product curation... Construction: Consider specialization areas..."
        },
        {
            id: "m2l_pa_13_competitivePositioning_owner", section: sectionName, text: "How involved is the owner in competitive positioning and differentiation strategy?",
            type: "mcq", valueKey: "m2l_pa_13_competitivePositioning_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
        // 14. Competitor Intelligence & Market Awareness
        {
            id: "m2l_pa_14_competitorIntelligence_process", section: sectionName,
            text: "14. Competitor Intelligence & Market Awareness: How systematically do you monitor and analyze your competitive landscape?",
            type: "mcq", valueKey: "m2l_pa_14_competitorIntelligence_process",
            options: [
                { text: "We have comprehensive competitive intelligence systems...", value: "a", score: 7 }, { text: "We regularly monitor key competitors...", value: "b", score: 5 },
                { text: "We have basic awareness of our competitive landscape...", value: "c", score: 3 }, { text: "We have limited knowledge of our competitors...", value: "d", score: 1 },
                { text: "We don't systematically monitor competitors...", value: "e", score: 0 }
            ], required: true,
        },
        // Preguntas Adicionales de Competitive Analysis (Texto)
        {
            id: "m2l_pa_14_top3Competitors", section: sectionName, text: "Who are your top 3 direct competitors?",
            type: "textarea", valueKey: "m2l_pa_14_top3Competitors", rows: 2, placeholder: "List up to 3 competitors"
        },
        {
            id: "m2l_pa_14_competitorAdvantages", section: sectionName, text: "What is each competitor's primary competitive advantage?",
            type: "textarea", valueKey: "m2l_pa_14_competitorAdvantages", rows: 3, placeholder: "For each of the top 3, list their main advantage"
        },
        {
            id: "m2l_pa_14_diffFromComp1", section: sectionName, text: "How do you differentiate from Competitor #1 (if listed)?",
            type: "textarea", valueKey: "m2l_pa_14_diffFromComp1", rows: 2
        },
        {
            id: "m2l_pa_14_diffFromComp2", section: sectionName, text: "How do you differentiate from Competitor #2 (if listed)?",
            type: "textarea", valueKey: "m2l_pa_14_diffFromComp2", rows: 2
        },
        {
            id: "m2l_pa_14_diffFromComp3", section: sectionName, text: "How do you differentiate from Competitor #3 (if listed)?",
            type: "textarea", valueKey: "m2l_pa_14_diffFromComp3", rows: 2
        },
        {
            id: "m2l_pa_14_competitorsDoBetter", section: sectionName, text: "What do competitors do better than you?",
            type: "textarea", valueKey: "m2l_pa_14_competitorsDoBetter", rows: 3
        },
        {
            id: "m2l_pa_14_youDoBetter", section: sectionName, text: "What do you do better than all competitors?",
            type: "textarea", valueKey: "m2l_pa_14_youDoBetter", rows: 3
        },
        // Sub-pregunta de Owner para la pregunta 14
        {
            id: "m2l_pa_14_competitorIntelligence_owner", section: sectionName, text: "How involved is the owner in competitive intelligence and analysis?",
            type: "mcq", valueKey: "m2l_pa_14_competitorIntelligence_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], required: true,
        },
    ];
    return part2Questions;
};