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
            placeholder: "e.g., 25", min: 0, max: 100
        }
    ];

    if (includeSpend) {
        questions.push({
            id: `m2l_${channelKey}_monthlySpend`, section: sectionName,
            text: `Monthly spend for ${channelDisplayName}:`, type: 'number', valueKey: `m2l_${channelKey}_monthlySpend`,
            placeholder: "e.g., 500", min: 0
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
        min: 0, max: 100
    });
    
    return questions;
};

// --- PREGUNTAS PARA MARKET TO LEAD - PARTE 1: Channels & Economics ---
export const getMarketToLeadPart1Questions = (sectionName) => {
    const part1Questions = [
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
            type: "number", valueKey: "m2l_unit_overallCAC", placeholder: "e.g., 150"
        },
        {
            id: "m2l_unit_primaryChannelCAC", section: sectionName, text: "What is your CAC for your primary marketing channel?",
            type: "number", valueKey: "m2l_unit_primaryChannelCAC", placeholder: "e.g., 100"
        },
        {
            id: "m2l_unit_trackCACByChannel", section: sectionName, text: "Do you track CAC by individual channel?",
            type: "select", valueKey: "m2l_unit_trackCACByChannel", 
            options: [ {value: '', text: 'Please select...'}, {value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}, {value: 'somewhat', text: 'Somewhat'}], required: true,
        },
         {
            id: "m2l_unit_90DayCustomerValue",
            section: sectionName, 
            text: "What is the customer value from a typical customer in their first 90 days (gross profit - commission on sale)?", 
            type: "number", 
            valueKey: "m2l_unit_90DayGrossProfit",
            placeholder: "e.g., 250",
        },
        {
            id: "m2l_unit_track90DayValue", section: sectionName, text: "Do you track this 90-day customer value metric consistently?",
            type: "select", valueKey: "m2l_unit_track90DayValue", 
            options: [ {value: '', text: 'Please select...'}, {value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}, {value: 'somewhat', text: 'Somewhat'}], required: true,
        },
        {
            id: "m2l_unit_monthlyAcqFixedCosts", section: sectionName, text: "What are your monthly fixed costs for customer acquisition (marketing team, tools, overhead)?",
            type: "number", valueKey: "m2l_unit_monthlyAcqFixedCosts", placeholder: "e.g., 5000"
        },
        {
            id: "m2l_unit_salesForAcqBreakeven", section: sectionName, text: "How many sales do you need monthly to cover these customer acquisition costs?",
            type: "number", valueKey: "m2l_unit_salesForAcqBreakeven", placeholder: "e.g., 50"
        },
        {
            id: "m2l_unit_totalMonthlyFixedCosts", section: sectionName, text: "What are your total monthly fixed costs for this product/service?",
            type: "number", valueKey: "m2l_unit_totalMonthlyFixedCosts", placeholder: "e.g., 10000"
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
        // 1. Market Research & Ideal Customer Profile (ICP) Definition
        {
            id: "m2l_pa_1_marketResearchICP_process", 
            section: sectionName,
            text: "1. Market Research & Ideal Customer Profile (ICP) Definition: How well-defined and validated is your ideal customer profile and market positioning?",
            type: "mcq", 
            valueKey: "m2l_pa_1_marketResearchICP_process",
            options: [
                { text: "We have a comprehensive, data-driven ICP based on extensive customer research including demographics, psychographics, pain points, buying behavior, and channel preferences. We regularly validate and refine our ICP based on customer feedback and performance data. Our entire marketing strategy is built around this detailed understanding.", value: "a", score: 7 },
                { text: "We have a solid ICP that covers key demographics, pain points, and basic behavioral patterns. We validate it periodically through customer surveys and sales feedback. Most of our marketing decisions align with this profile.", value: "b", score: 5 },
                { text: "We have a basic understanding of our ideal customer but it may lack depth or specificity. Our ICP covers demographics and some pain points but isn't always used consistently across marketing efforts.", value: "c", score: 3 },
                { text: "We have a general idea of who our customers are but it's not well-documented or systematically used to guide marketing decisions.", value: "d", score: 1 },
                { text: "We don't have a clearly defined ICP, or I'm not sure how our customer profile is currently defined.", value: "e", score: 0 }
            ], 
            required: true, 
           helpText: "",
            industryContext:"Industry Context:\nConsulting: Consider client industry, company size, decision-maker roles, and typical project triggers.\nManufacturing: Focus on customer industry verticals, order volumes, geographic distribution, and procurement processes.\nRetail: Think about customer demographics, shopping behaviors, seasonal patterns, and price sensitivity.\nConstruction: Consider project types, client size (residential/commercial), geographic service area, and decision-making timelines."
        },
        {
            id: "m2l_pa_1_marketResearchICP_owner", 
            section: sectionName, 
            text: "How involved is the owner in market research and ICP development?",
            type: "mcq", 
            valueKey: "m2l_pa_1_marketResearchICP_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 2. Brand Positioning & Messaging Strategy
        {
            id: "m2l_pa_2_brandPositioning_process", 
            section: sectionName, 
            text: "2. Brand Positioning & Messaging Strategy: How clear and differentiated is your brand positioning in the marketplace?",
            type: "mcq", 
            valueKey: "m2l_pa_2_brandPositioning_process",
            options: [
                { text: "We have a compelling, differentiated brand position that clearly communicates our unique value proposition. Our messaging is consistent across all channels, resonates strongly with our ICP, and is regularly tested and optimized. We have documented brand guidelines and messaging frameworks that guide all communications.", value: "a", score: 7 },
                { text: "We have clear brand positioning and messaging that differentiates us from competitors. Our core value proposition is well-articulated and generally consistent across channels, though some refinement may be needed.", value: "b", score: 5 },
                { text: "We have basic brand positioning but it may not be consistently applied or clearly differentiated. Our messaging covers what we do but may not strongly communicate why we're different or better.", value: "c", score: 3 },
                { text: "Our brand positioning is unclear or generic. We struggle to articulate what makes us different from competitors.", value: "d", score: 1 },
                { text: "We don't have defined brand positioning or messaging strategy, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_2_brandPositioning_owner", 
            section: sectionName, 
            text: "How involved is the owner in brand positioning and messaging?",
            type: "mcq", 
            valueKey: "m2l_pa_2_brandPositioning_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 3. Content Strategy & Development
        {
            id: "m2l_pa_3_contentStrategy_process", 
            section: sectionName, 
            text: "3. Content Strategy & Development: How systematic and effective is your content creation and distribution strategy?",
            type: "mcq", 
            valueKey: "m2l_pa_3_contentStrategy_process",
            options: [
                { text: "We have a comprehensive content strategy with documented editorial calendars, content pillars aligned to customer journey stages, and systematic distribution across multiple channels. Content performance is tracked and optimized regularly. We repurpose content efficiently across formats and channels.", value: "a", score: 7 },
                { text: "We create content regularly with a general strategy and calendar. Content is distributed across key channels and we track basic performance metrics. Some content repurposing happens but could be more systematic.", value: "b", score: 5 },
                { text: "We create content somewhat regularly but lack a comprehensive strategy or calendar. Distribution is inconsistent and performance tracking is limited.", value: "c", score: 3 },
                { text: "Content creation is ad-hoc and reactive. We don't have a clear strategy or systematic approach to content development and distribution.", value: "d", score: 1 },
                { text: "We don't have a content strategy or systematic content creation process, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_3_contentStrategy_owner", 
            section: sectionName, 
            text: "How involved is the owner in content strategy and creation?",
            type: "mcq", 
            valueKey: "m2l_pa_3_contentStrategy_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 4. Lead Generation & Capture Systems
        {
            id: "m2l_pa_4_leadGenCapture_process", 
            section: sectionName, 
            text: "4. Lead Generation & Capture Systems: How effective are your systems for converting traffic into qualified leads?",
            type: "mcq", 
            valueKey: "m2l_pa_4_leadGenCapture_process",
            options: [
                { text: "We have sophisticated lead generation systems with multiple lead magnets, optimized landing pages, progressive profiling, and automated lead scoring. Our conversion rates are tracked and optimized regularly. We have clear processes for lead qualification and routing.", value: "a", score: 7 },
                { text: "We have solid lead generation processes with effective lead magnets and landing pages. Basic lead scoring and qualification processes are in place. Conversion rates are monitored and occasionally optimized.", value: "b", score: 5 },
                { text: "We have basic lead capture mechanisms but they may not be optimized or systematically managed. Lead qualification processes exist but aren't consistently applied.", value: "c", score: 3 },
                { text: "Our lead generation is basic with minimal optimization. We capture leads but don't have systematic processes for qualification or optimization.", value: "d", score: 1 },
                { text: "We don't have systematic lead generation processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_4_leadGenCapture_owner", 
            section: sectionName, 
            text: "How involved is the owner in lead generation system management?",
            type: "mcq", 
            valueKey: "m2l_pa_4_leadGenCapture_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 5. Marketing Automation & Nurturing
        {
            id: "m2l_pa_5_marketingAutomation_process", 
            section: sectionName, 
            text: "5. Marketing Automation & Nurturing: How sophisticated are your marketing automation and lead nurturing systems?",
            type: "mcq", 
            valueKey: "m2l_pa_5_marketingAutomation_process",
            options: [
                { text: "We have comprehensive marketing automation with segmented nurture sequences, behavioral triggers, personalized content delivery, and integrated CRM workflows. Lead scoring is dynamic and automated handoffs to sales are seamless. All sequences are regularly tested and optimized.", value: "a", score: 7 },
                { text: "We have solid marketing automation with basic nurture sequences and some segmentation. CRM integration works well and lead handoffs are generally smooth. Some testing and optimization occurs.", value: "b", score: 5 },
                { text: "We have basic email automation and simple nurture sequences. Integration between marketing and sales systems exists but may have gaps. Limited testing and optimization.", value: "c", score: 3 },
                { text: "Our marketing automation is minimal with basic email sequences. Integration between systems is limited and handoffs may be manual.", value: "d", score: 1 },
                { text: "We don't have marketing automation or systematic nurturing processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_5_marketingAutomation_owner", 
            section: sectionName, 
            text: "How involved is the owner in marketing automation management?",
            type: "mcq", 
            valueKey: "m2l_pa_5_marketingAutomation_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 6. Paid Media Strategy & Optimization
        {
            id: "m2l_pa_6_paidMedia_process", 
            section: sectionName, 
            text: "6. Paid Media Strategy & Optimization: How strategic and data-driven is your approach to paid advertising?",
            type: "mcq", 
            valueKey: "m2l_pa_6_paidMedia_process",
            options: [
                { text: "We have a comprehensive paid media strategy with clear channel selection criteria, systematic A/B testing, advanced audience segmentation, and sophisticated attribution modeling. ROAS is optimized across channels and campaigns are continuously refined based on performance data.", value: "a", score: 7 },
                { text: "We have a solid paid media approach with regular testing and optimization. We track key metrics across channels and make data-driven decisions about budget allocation and campaign adjustments.", value: "b", score: 5 },
                { text: "We run paid campaigns with basic tracking and occasional optimization. Budget allocation is somewhat strategic but may not be fully data-driven.", value: "c", score: 3 },
                { text: "Our paid media efforts are basic with minimal optimization or strategic approach. We may track basic metrics but don't systematically optimize based on data.", value: "d", score: 1 },
                { text: "We don't run paid advertising or have a strategic approach to paid media, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_6_paidMedia_owner", 
            section: sectionName, 
            text: "How involved is the owner in paid media strategy and management?",
            type: "mcq", 
            valueKey: "m2l_pa_6_paidMedia_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 7. Performance Analytics & Attribution
        {
            id: "m2l_pa_7_analyticsAttribution_process", 
            section: sectionName, 
            text: "7. Performance Analytics & Attribution: How comprehensive is your marketing measurement and attribution system?",
            type: "mcq", 
            valueKey: "m2l_pa_7_analyticsAttribution_process",
            options: [
                { text: "We have sophisticated attribution modeling that tracks customer journeys across all touchpoints. We measure both online and offline conversions, understand multi-touch attribution, and can accurately calculate ROI by channel and campaign. Regular reporting provides actionable insights for optimization.", value: "a", score: 7 },
                { text: "We have solid analytics systems that track most important metrics across channels. Attribution covers major touchpoints and we can generally determine which marketing efforts drive results. Regular reporting guides optimization decisions.", value: "b", score: 5 },
                { text: "We track basic marketing metrics and have some understanding of which channels drive results. Attribution may be limited to last-click or first-touch models. Reporting happens but may not consistently drive optimization.", value: "c", score: 3 },
                { text: "Our measurement capabilities are basic with limited attribution understanding. We may track website traffic and basic conversion metrics but struggle to connect marketing efforts to business results.", value: "d", score: 1 },
                { text: "We don't have comprehensive marketing measurement systems, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_7_analyticsAttribution_owner", 
            section: sectionName, 
            text: "How involved is the owner in marketing analytics and performance review?",
            type: "mcq", 
            valueKey: "m2l_pa_7_analyticsAttribution_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 8. Customer Journey Optimization
        {
            id: "m2l_pa_8_customerJourney_process", 
            section: sectionName, 
            text: "8. Customer Journey Optimization: How well do you understand and optimize the complete customer journey from awareness to purchase?",
            type: "mcq", 
            valueKey: "m2l_pa_8_customerJourney_process",
            options: [
                { text: "We have mapped the complete customer journey with clear touchpoints, conversion requirements, and optimization opportunities at each stage. We regularly analyze journey performance, identify friction points, and systematically test improvements. Customer experience is consistent across all channels.", value: "a", score: 7 },
                { text: "We understand the key stages of our customer journey and have identified major touchpoints. Some optimization efforts are in place and we generally provide a consistent experience across channels.", value: "b", score: 5 },
                { text: "We have basic understanding of our customer journey but mapping may be incomplete. Some touchpoints are optimized but the approach isn't systematic across all stages.", value: "c", score: 3 },
                { text: "Our customer journey understanding is limited and optimization efforts are sporadic. Customer experience may vary significantly across different touchpoints.", value: "d", score: 1 },
                { text: "We haven't mapped our customer journey or don't have systematic approach to journey optimization, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_8_customerJourney_owner", 
            section: sectionName, 
            text: "How involved is the owner in customer journey mapping and optimization?",
            type: "mcq", 
            valueKey: "m2l_pa_8_customerJourney_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 9. Competitive Analysis & Market Intelligence
        {
            id: "m2l_pa_9_competitiveAnalysis_process", 
            section: sectionName,
            text: "9. Competitive Analysis & Market Intelligence: How systematic is your approach to competitive analysis and market intelligence?",
            type: "mcq", 
            valueKey: "m2l_pa_9_competitiveAnalysis_process",
            options: [
                { text: "We conduct comprehensive competitive analysis including positioning, messaging, pricing, channel strategies, and performance estimation. We monitor competitive activities regularly, track market trends, and adjust our strategy based on market intelligence. We have systematic processes for gathering and analyzing competitive data.", value: "a", score: 7 },
                { text: "We regularly monitor key competitors and understand their basic strategies and positioning. We track market trends and occasionally adjust our approach based on competitive intelligence.", value: "b", score: 5 },
                { text: "We have basic awareness of our competitive landscape and monitor major competitors occasionally. Market intelligence gathering is somewhat ad-hoc.", value: "c", score: 3 },
                { text: "Our competitive analysis is limited and mostly reactive. We may be aware of major competitors but don't systematically track their activities or market trends.", value: "d", score: 1 },
                { text: "We don't conduct systematic competitive analysis or market intelligence gathering, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_9_competitiveAnalysis_owner", 
            section: sectionName, 
            text: "How involved is the owner in competitive analysis and market intelligence?",
            type: "mcq", 
            valueKey: "m2l_pa_9_competitiveAnalysis_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 10. Marketing Technology Stack Integration
        {
            id: "m2l_pa_10_martech_process", 
            section: sectionName, 
            text: "10. Marketing Technology Stack Integration: How well-integrated and optimized is your marketing technology ecosystem?",
            type: "mcq", 
            valueKey: "m2l_pa_10_martech_process",
            options: [
                { text: "We have a fully integrated marketing technology stack with seamless data flow between CRM, email marketing, analytics, social media management, and other tools. Automation works across platforms and we have comprehensive reporting dashboards. Technology selection is strategic and ROI-driven.", value: "a", score: 7 },
                { text: "Our key marketing technologies are well-integrated with good data flow between major systems. Most automation works smoothly and reporting provides useful insights across platforms.", value: "b", score: 5 },
                { text: "We have basic integration between key marketing tools but some data silos may exist. Automation works for core functions but may require manual intervention for complex workflows.", value: "c", score: 3 },
                { text: "Our marketing tools are largely disconnected requiring manual data transfer and workflow management. Integration is limited and reporting may be fragmented.", value: "d", score: 1 },
                { text: "We don't have integrated marketing technology systems, or I'm not sure how our current tools work together.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_10_martech_owner", 
            section: sectionName, 
            text: "How involved is the owner in marketing technology selection and management?",
            type: "mcq", 
            valueKey: "m2l_pa_10_martech_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 11. Team & Resource Management
        {
            id: "m2l_pa_11_teamResource_process", 
            section: sectionName, 
            text: "11. Team & Resource Management: How effectively organized and managed are your marketing team and resources?",
            type: "mcq", 
            valueKey: "m2l_pa_11_teamResource_process",
            options: [
                { text: "We have a well-structured marketing team with clear roles, responsibilities, and performance metrics. Resource allocation is strategic and data-driven. Team members have appropriate skills and ongoing training. Project management systems ensure efficient execution and accountability.", value: "a", score: 7 },
                { text: "Our marketing team is generally well-organized with defined roles and basic performance tracking. Resource allocation is planned and most team members have appropriate skills for their responsibilities.", value: "b", score: 5 },
                { text: "We have basic team structure and role definitions but may lack clear performance metrics or systematic resource planning. Team skills may have some gaps.", value: "c", score: 3 },
                { text: "Our marketing team organization is informal with unclear roles and limited performance tracking. Resource allocation is often reactive rather than strategic.", value: "d", score: 1 },
                { text: "We don't have organized marketing team structure or systematic resource management, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_11_teamResource_owner", 
            section: sectionName, 
            text: "How involved is the owner in marketing team management and resource allocation?",
            type: "mcq", 
            valueKey: "m2l_pa_11_teamResource_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 12. Budget Planning & ROI Management
        {
            id: "m2l_pa_12_budgetROI_process", 
            section: sectionName, 
            text: "12. Budget Planning & ROI Management: How strategic and data-driven is your marketing budget planning and ROI management?",
            type: "mcq", 
            valueKey: "m2l_pa_12_budgetROI_process",
            options: [
                { text: "We have comprehensive budget planning with clear allocation strategies across channels based on historical performance and projected ROI. We track actual ROI by channel and campaign, regularly optimize budget allocation, and have clear processes for budget adjustments based on performance data.", value: "a", score: 7 },
                { text: "We have solid budget planning processes with general allocation strategies. ROI is tracked for major channels and budget adjustments are made based on performance, though optimization may not be continuous.", value: "b", score: 5 },
                { text: "We have basic budget planning but allocation may not be fully data-driven. Some ROI tracking exists but optimization of budget allocation is limited.", value: "c", score: 3 },
                { text: "Our budget planning is basic with limited ROI tracking or strategic allocation. Budget decisions may be made without comprehensive performance data.", value: "d", score: 1 },
                { text: "We don't have systematic budget planning or ROI management processes, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        {
            id: "m2l_pa_12_budgetROI_owner", 
            section: sectionName, 
            text: "How involved is the owner in marketing budget planning and ROI management?",
            type: "mcq", 
            valueKey: "m2l_pa_12_budgetROI_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 13. Competitive Positioning & Differentiation
        {
            id: "m2l_pa_13_competitivePositioning_process", 
            section: sectionName,
            text: "13. Competitive Positioning & Differentiation: How clearly differentiated is your business from direct competitors?",
            type: "mcq", 
            valueKey: "m2l_pa_13_competitivePositioning_process",
            options: [
                { text: "We have achieved \"category of one\" status where direct comparison with competitors is difficult or impossible. Our unique positioning makes us the obvious choice for our ideal customers. We consistently avoid price-based competition and command premium pricing.", value: "a", score: 7 },
                { text: "We are clearly differentiated from competitors with unique value propositions that resonate with our target market. We rarely compete solely on price and have strong competitive advantages.", value: "b", score: 5 },
                { text: "We have some differentiation from competitors but it may not be clearly communicated or consistently applied. We sometimes find ourselves in price-based competition.", value: "c", score: 3 },
                { text: "Our differentiation is minimal and we frequently compete primarily on price. Customers often view us as interchangeable with competitors.", value: "d", score: 1 },
                { text: "We struggle to differentiate ourselves from competitors and consistently compete on price, or I'm not sure how we're positioned relative to competitors.", value: "e", score: 0 }
            ], 
            required: true, 
            helpText: "", // O un tooltip breve si lo deseas, ej: "Learn more about ICP definition."
            industryContext:"Industry Context:\nConsulting: Consider your methodology, expertise area, industry specialization, or service delivery approach.\nManufacturing: Focus on product features, quality standards, customization capabilities, or supply chain advantages.\nRetail: Think about product curation, customer experience, location advantages, or brand positioning.\nConstruction: Consider specialization areas, quality standards, project management approach, or customer relationships."
        },
        {
            id: "m2l_pa_13_competitivePositioning_owner", 
            section: sectionName, 
            text: "How involved is the owner in competitive positioning and differentiation strategy?",
            type: "mcq", 
            valueKey: "m2l_pa_13_competitivePositioning_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },

        // 14. Competitor Intelligence & Market Awareness
        {
            id: "m2l_pa_14_competitorIntelligence_process", 
            section: sectionName,
            text: "14. Competitor Intelligence & Market Awareness: How systematically do you monitor and analyze your competitive landscape?",
            type: "mcq", 
            valueKey: "m2l_pa_14_competitorIntelligence_process",
            options: [
                { text: "We have comprehensive competitive intelligence systems that track competitor activities, pricing, positioning, marketing strategies, and market movements. We use this intelligence to anticipate market changes and adjust our strategy proactively.", value: "a", score: 7 },
                { text: "We regularly monitor key competitors and track their major activities, pricing changes, and market positioning. We use competitive intelligence to inform our strategic decisions.", value: "b", score: 5 },
                { text: "We have basic awareness of our competitive landscape and occasionally monitor competitor activities. Our competitive analysis is somewhat informal or reactive.", value: "c", score: 3 },
                { text: "We have limited knowledge of our competitors beyond basic awareness. Competitive analysis is rare and mostly reactive.", value: "d", score: 1 },
                { text: "We don't systematically monitor competitors or conduct competitive analysis, or I'm not sure how this is currently handled.", value: "e", score: 0 }
            ], 
            required: true,
        },
        // Sub-pregunta de Owner para la pregunta 14 (después de las preguntas de texto)
        {
            id: "m2l_pa_14_competitorIntelligence_owner", 
            section: sectionName, 
            text: "How involved is the owner in competitive intelligence and analysis?",
            type: "mcq", 
            valueKey: "m2l_pa_14_competitorIntelligence_owner",
            options: [ { text: "Not at all / Informed only", value: "a", score: 5 }, { text: "Consulted", value: "b", score: 3 }, { text: "Accountable", value: "c", score: 1 }, { text: "Responsible", value: "d", score: 0 } ], 
            required: true,
        },
        // Preguntas Adicionales de Competitive Analysis (Texto)
        {
            id: "m2l_pa_14_top3Competitors", 
            section: sectionName, 
            text: "Who are your top 3 direct competitors?",
            type: "textarea", 
            valueKey: "m2l_pa_14_top3Competitors", 
            rows: 2, 
            placeholder: "List up to 3 competitors"
        },
        {
            id: "m2l_pa_14_competitorAdvantages", 
            section: sectionName, 
            text: "What is each competitor's primary competitive advantage?",
            type: "textarea", 
            valueKey: "m2l_pa_14_competitorAdvantages", 
            rows: 3, 
            placeholder: "For each of the top 3, list their main advantage"
        },
        {
            id: "m2l_pa_14_diffFromComp1", 
            section: sectionName, 
            text: "How do you differentiate from Competitor #1 (if listed)?",
            type: "textarea", 
            valueKey: "m2l_pa_14_diffFromComp1", 
            rows: 2
        },
        {
            id: "m2l_pa_14_diffFromComp2", 
            section: sectionName, 
            text: "How do you differentiate from Competitor #2 (if listed)?",
            type: "textarea", 
            valueKey: "m2l_pa_14_diffFromComp2", 
            rows: 2
        },
        {
            id: "m2l_pa_14_diffFromComp3", 
            section: sectionName, 
            text: "How do you differentiate from Competitor #3 (if listed)?",
            type: "textarea", 
            valueKey: "m2l_pa_14_diffFromComp3", 
            rows: 2
        },
        {
            id: "m2l_pa_14_competitorsDoBetter", 
            section: sectionName, 
            text: "What do competitors do better than you?",
            type: "textarea", 
            valueKey: "m2l_pa_14_competitorsDoBetter", 
            rows: 3
        },
        {
            id: "m2l_pa_14_youDoBetter", 
            section: sectionName, 
            text: "What do you do better than all competitors?",
            type: "textarea", 
            valueKey: "m2l_pa_14_youDoBetter", 
            rows: 3
        },
    ];
    return part2Questions;
};