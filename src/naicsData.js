// src/naicsData.js

// --- CRITICAL NOTE ---
// The 'adjustmentFactor' values below have been MODIFIED TO 0 as requested.
// This will likely result in valuation multiples being adjusted to 0,
// leading to an estimated valuation of $0.
// Restore original factors or factors derived from market data for meaningful results.

export const naicsSectors = [
  {
    code: "11",
    name: "Agriculture, Forestry, Fishing and Hunting",
    subSectors: [
      { name: "Crop Production", adjustmentFactor: 0 },
      { name: "Animal Production and Aquaculture", adjustmentFactor: 0 },
      { name: "Forestry and Logging", adjustmentFactor: 0 },
      { name: "Fishing, Hunting and Trapping", adjustmentFactor: 0 },
      { name: "Support Activities for Agriculture and Forestry", adjustmentFactor: 0 }
    ]
  },
  {
    code: "21",
    name: "Mining, Quarrying, and Oil and Gas Extraction",
    subSectors: [
      { name: "Oil and Gas Extraction", adjustmentFactor: 0 },
      { name: "Mining (except Oil and Gas)", adjustmentFactor: 0 },
      { name: "Support Activities for Mining", adjustmentFactor: 0 }
    ]
  },
  {
    code: "22",
    name: "Utilities",
    subSectors: [
      { name: "Electric Power Generation, Transmission and Distribution", adjustmentFactor: 0 },
      { name: "Natural Gas Distribution", adjustmentFactor: 0 },
      { name: "Water, Sewage and Other Systems", adjustmentFactor: 0 }
    ]
  },

  {
    code: "23",
    name: "Construction", // Contains 31 specific 6-digit sub-sectors
    subSectors: [
      // Sub-sector under 236 - Construction of Buildings
      { code: "236115", name: "New Single-Family Housing Construction (except For-Rent Builders)", adjustmentFactor: 0 },
      { code: "236116", name: "New Multifamily Housing Construction (except For-Rent Builders)", adjustmentFactor: 0 },
      { code: "236117", name: "New Housing For-Rent Builders", adjustmentFactor: 0 },
      { code: "236118", name: "Residential Remodelers", adjustmentFactor: 0 },
      { code: "236210", name: "Industrial Building Construction", adjustmentFactor: 0 },
      { code: "236220", name: "Commercial and Institutional Building Construction", adjustmentFactor: 0 },

      // Sub-sector under 237 - Heavy and Civil Engineering Construction
      { code: "237110", name: "Water and Sewer Line and Related Structures Construction", adjustmentFactor: 0 },
      { code: "237120", name: "Oil and Gas Pipeline and Related Structures Construction", adjustmentFactor: 0 },
      { code: "237130", name: "Power and Communication Line and Related Structures Construction", adjustmentFactor: 0 },
      { code: "237210", name: "Land Subdivision", adjustmentFactor: 0 },
      { code: "237310", name: "Highway, Street, and Bridge Construction", adjustmentFactor: 0 },
      { code: "237990", name: "Other Heavy and Civil Engineering Construction", adjustmentFactor: 0 },

      // Sub-sector under 238 - Specialty Trade Contractors
      { code: "238110", name: "Poured Concrete Foundation and Structure Contractors", adjustmentFactor: 0 },
      { code: "238120", name: "Structural Steel and Precast Concrete Contractors", adjustmentFactor: 0 },
      { code: "238130", name: "Framing Contractors", adjustmentFactor: 0 },
      { code: "238140", name: "Masonry Contractors", adjustmentFactor: 0 },
      { code: "238150", name: "Glass and Glazing Contractors", adjustmentFactor: 0 },
      { code: "238160", name: "Roofing Contractors", adjustmentFactor: 0 },
      { code: "238170", name: "Siding Contractors", adjustmentFactor: 0 },
      { code: "238190", name: "Other Foundation, Structure, and Building Exterior Contractors", adjustmentFactor: 0 },
      { code: "238210", name: "Electrical Contractors and Other Wiring Installation Contractors", adjustmentFactor: 0 },
      { code: "238220", name: "Plumbing, Heating, and Air-Conditioning Contractors", adjustmentFactor: 0 },
      { code: "238290", name: "Other Building Equipment Contractors", adjustmentFactor: 0 },
      { code: "238310", name: "Drywall and Insulation Contractors", adjustmentFactor: 0 },
      { code: "238320", name: "Painting and Wall Covering Contractors", adjustmentFactor: 0 },
      { code: "238330", name: "Flooring Contractors", adjustmentFactor: 0 },
      { code: "238340", name: "Tile and Terrazzo Contractors", adjustmentFactor: 0 },
      { code: "238350", name: "Finish Carpentry Contractors", adjustmentFactor: 0 },
      { code: "238390", name: "Other Building Finishing Contractors", adjustmentFactor: 0 },
      { code: "238910", name: "Site Preparation Contractors", adjustmentFactor: 0 },
      { code: "238990", name: "All Other Specialty Trade Contractors", adjustmentFactor: 0 }
    ]
  },
  {
    code: "31-33",
    name: "Manufacturing",
    subSectors: [
      { name: "Food Manufacturing", adjustmentFactor: 0 },
      { name: "Beverage and Tobacco Product Manufacturing", adjustmentFactor: 0 },
      { name: "Textile Mills & Product Mills", adjustmentFactor: 0 },
      { name: "Apparel Manufacturing", adjustmentFactor: 0 },
      { name: "Leather and Allied Product Manufacturing", adjustmentFactor: 0 },
      { name: "Wood Product Manufacturing", adjustmentFactor: 0 },
      { name: "Paper Manufacturing", adjustmentFactor: 0 },
      { name: "Printing and Related Support Activities", adjustmentFactor: 0 },
      { name: "Petroleum and Coal Products Manufacturing", adjustmentFactor: 0 },
      { name: "Chemical Manufacturing", adjustmentFactor: 0 },
      { name: "Plastics and Rubber Products Manufacturing", adjustmentFactor: 0 },
      { name: "Nonmetallic Mineral Product Manufacturing", adjustmentFactor: 0 },
      { name: "Primary Metal Manufacturing", adjustmentFactor: 0 },
      { name: "Fabricated Metal Product Manufacturing", adjustmentFactor: 0 },
      { name: "Machinery Manufacturing", adjustmentFactor: 0 },
      { name: "Computer and Electronic Product Manufacturing", adjustmentFactor: 0 },
      { name: "Electrical Equipment, Appliance, and Component Manufacturing", adjustmentFactor: 0 },
      { name: "Transportation Equipment Manufacturing", adjustmentFactor: 0 },
      { name: "Furniture and Related Product Manufacturing", adjustmentFactor: 0 },
      { name: "Miscellaneous Manufacturing", adjustmentFactor: 0 }
    ]
  },
  {
    code: "42",
    name: "Wholesale Trade",
    subSectors: [
      { name: "Merchant Wholesalers, Durable Goods", adjustmentFactor: 0 },
      { name: "Merchant Wholesalers, Nondurable Goods", adjustmentFactor: 0 },
      { name: "Wholesale Electronic Markets and Agents and Brokers", adjustmentFactor: 0 }
    ]
  },
  {
    code: "44-45",
    name: "Retail Trade",
    subSectors: [
      { name: "Motor Vehicle and Parts Dealers", adjustmentFactor: 0 },
      { name: "Furniture and Home Furnishings Stores", adjustmentFactor: 0 },
      { name: "Electronics and Appliance Stores", adjustmentFactor: 0 },
      { name: "Building Material and Garden Equipment Stores", adjustmentFactor: 0 },
      { name: "Food and Beverage Stores", adjustmentFactor: 0 },
      { name: "Health and Personal Care Stores", adjustmentFactor: 0 },
      { name: "Gasoline Stations", adjustmentFactor: 0 },
      { name: "Clothing and Clothing Accessories Stores", adjustmentFactor: 0 },
      { name: "Sporting Goods, Hobby, Book, and Music Stores", adjustmentFactor: 0 },
      { name: "General Merchandise Stores", adjustmentFactor: 0 },
      { name: "Miscellaneous Store Retailers", adjustmentFactor: 0 },
      { name: "Nonstore Retailers", adjustmentFactor: 0 }
    ]
  },
  {
    code: "48-49",
    name: "Transportation and Warehousing",
    subSectors: [
        { name: "Air Transportation", adjustmentFactor: 0 },
        { name: "Rail Transportation", adjustmentFactor: 0 },
        { name: "Water Transportation", adjustmentFactor: 0 },
        { name: "Truck Transportation", adjustmentFactor: 0 },
        { name: "Transit and Ground Passenger Transportation", adjustmentFactor: 0 },
        { name: "Pipeline Transportation", adjustmentFactor: 0 },
        { name: "Scenic and Sightseeing Transportation", adjustmentFactor: 0 },
        { name: "Support Activities for Transportation", adjustmentFactor: 0 },
        { name: "Couriers and Messengers", adjustmentFactor: 0 },
        { name: "Warehousing and Storage", adjustmentFactor: 0 }
    ]
  },
  {
    code: "51",
    name: "Information",
    subSectors: [
      { name: "Publishing Industries (except Internet)", adjustmentFactor: 0 },
      { name: "Motion Picture and Sound Recording Industries", adjustmentFactor: 0 },
      { name: "Broadcasting (except Internet)", adjustmentFactor: 0 },
      { name: "Telecommunications", adjustmentFactor: 0 },
      { name: "Data Processing, Hosting, and Related Services", adjustmentFactor: 0 },
      { name: "Other Information Services", adjustmentFactor: 0 }
    ]
  },
  {
    code: "52",
    name: "Finance and Insurance",
    subSectors: [
      { name: "Monetary Authorities - Central Bank", adjustmentFactor: 0 },
      { name: "Credit Intermediation and Related Activities", adjustmentFactor: 0 },
      { name: "Securities, Commodity Contracts, Intermediation and Brokerage", adjustmentFactor: 0 },
      { name: "Insurance Carriers and Related Activities", adjustmentFactor: 0 },
      { name: "Funds, Trusts, and Other Financial Vehicles", adjustmentFactor: 0 }
    ]
  },
  {
    code: "53",
    name: "Real Estate and Rental and Leasing",
    subSectors: [
      { name: "Lessors of Real Estate", adjustmentFactor: 0 },
      { name: "Offices of Real Estate Agents and Brokers", adjustmentFactor: 0 },
      { name: "Activities Related to Real Estate", adjustmentFactor: 0 },
      { name: "Automotive Equipment Rental and Leasing", adjustmentFactor: 0 },
      { name: "Consumer Goods Rental", adjustmentFactor: 0 },
      { name: "General Rental Centers", adjustmentFactor: 0 },
      { name: "Commercial and Industrial Machinery and Equipment Rental and Leasing", adjustmentFactor: 0 }
    ]
  },
  {
    code: "54",
    name: "Professional, Scientific, and Technical Services",
    subSectors: [
      { name: "Legal Services", adjustmentFactor: 0 },
      { name: "Accounting, Tax Preparation, Bookkeeping, and Payroll Services", adjustmentFactor: 0 },
      { name: "Architectural, Engineering, and Related Services", adjustmentFactor: 0 },
      { name: "Specialized Design Services", adjustmentFactor: 0 },
      { name: "Computer Systems Design and Related Services", adjustmentFactor: 0 },
      { name: "Management, Scientific, and Technical Consulting Services", adjustmentFactor: 0 },
      { name: "Scientific Research and Development Services", adjustmentFactor: 0 },
      { name: "Advertising, Public Relations, and Related Services", adjustmentFactor: 0 },
      { name: "Other Professional, Scientific, and Technical Services", adjustmentFactor: 0 }
    ]
  },
  {
    code: "55",
    name: "Management of Companies and Enterprises",
    subSectors: [
      { name: "Offices of Bank Holding Companies", adjustmentFactor: 0 },
      { name: "Offices of Other Holding Companies", adjustmentFactor: 0 },
      { name: "Corporate, Subsidiary, and Regional Managing Offices", adjustmentFactor: 0 }
    ]
  },
  {
    code: "56",
    name: "Administrative and Support and Waste Management and Remediation Services",
    subSectors: [
      { name: "Office Administrative Services", adjustmentFactor: 0 },
      { name: "Facilities Support Services", adjustmentFactor: 0 },
      { name: "Employment Services", adjustmentFactor: 0 },
      { name: "Business Support Services", adjustmentFactor: 0 },
      { name: "Travel Arrangement and Reservation Services", adjustmentFactor: 0 },
      { name: "Investigation and Security Services", adjustmentFactor: 0 },
      { name: "Services to Buildings and Dwellings", adjustmentFactor: 0 },
      { name: "Other Support Services", adjustmentFactor: 0 },
      { name: "Waste Management and Remediation Services", adjustmentFactor: 0 }
    ]
  },
  {
    code: "61",
    name: "Educational Services",
    subSectors: [
      { name: "Elementary and Secondary Schools", adjustmentFactor: 0 },
      { name: "Junior Colleges", adjustmentFactor: 0 },
      { name: "Colleges, Universities, and Professional Schools", adjustmentFactor: 0 },
      { name: "Business Schools and Computer and Management Training", adjustmentFactor: 0 },
      { name: "Technical and Trade Schools", adjustmentFactor: 0 },
      { name: "Other Schools and Instruction", adjustmentFactor: 0 },
      { name: "Educational Support Services", adjustmentFactor: 0 }
    ]
  },
  {
    code: "62",
    name: "Health Care and Social Assistance",
    subSectors: [
      { name: "Ambulatory Health Care Services", adjustmentFactor: 0 },
      { name: "Hospitals", adjustmentFactor: 0 },
      { name: "Nursing and Residential Care Facilities", adjustmentFactor: 0 },
      { name: "Social Assistance", adjustmentFactor: 0 }
    ]
  },
  {
    code: "71",
    name: "Arts, Entertainment, and Recreation",
    subSectors: [
      { name: "Performing Arts Companies", adjustmentFactor: 0 },
      { name: "Spectator Sports", adjustmentFactor: 0 },
      { name: "Promoters of Performing Arts, Sports, and Similar Events", adjustmentFactor: 0 },
      { name: "Agents and Managers for Artists, Athletes, Entertainers", adjustmentFactor: 0 },
      { name: "Independent Artists, Writers, and Performers", adjustmentFactor: 0 },
      { name: "Museums, Historical Sites, and Similar Institutions", adjustmentFactor: 0 },
      { name: "Amusement Parks and Arcades", adjustmentFactor: 0 },
      { name: "Gambling Industries", adjustmentFactor: 0 },
      { name: "Other Amusement and Recreation Industries", adjustmentFactor: 0 }
    ]
  },
  {
    code: "72",
    name: "Accommodation and Food Services",
    subSectors: [
      { name: "Traveler Accommodation", adjustmentFactor: 0 },
      { name: "RV Parks and Recreational Camps", adjustmentFactor: 0 },
      { name: "Rooming and Boarding Houses, Dormitories", adjustmentFactor: 0 },
      { name: "Food Services and Drinking Places", adjustmentFactor: 0 }
    ]
  },
  {
    code: "81",
    name: "Other Services (except Public Administration)",
    subSectors: [
      { name: "Automotive Repair and Maintenance", adjustmentFactor: 0 },
      { name: "Electronic and Precision Equipment Repair and Maintenance", adjustmentFactor: 0 },
      { name: "Commercial and Industrial Machinery Repair and Maintenance", adjustmentFactor: 0 },
      { name: "Personal and Household Goods Repair and Maintenance", adjustmentFactor: 0 },
      { name: "Personal Care Services", adjustmentFactor: 0 },
      { name: "Death Care Services", adjustmentFactor: 0 },
      { name: "Drycleaning and Laundry Services", adjustmentFactor: 0 },
      { name: "Other Personal Services", adjustmentFactor: 0 },
      { name: "Religious Organizations", adjustmentFactor: 0 },
      { name: "Grantmaking and Giving Services", adjustmentFactor: 0 },
      { name: "Social Advocacy Organizations", adjustmentFactor: 0 },
      { name: "Civic and Social Organizations", adjustmentFactor: 0 },
      { name: "Business, Professional, Labor, Political Organizations", adjustmentFactor: 0 },
      { name: "Private Households", adjustmentFactor: 0 }
    ]
  },
  {
    code: "92",
    name: "Public Administration",
    subSectors: [
      { name: "Executive, Legislative, and Other General Government Support", adjustmentFactor: 0 },
      { name: "Justice, Public Order, and Safety Activities", adjustmentFactor: 0 },
      { name: "Administration of Human Resource Programs", adjustmentFactor: 0 },
      { name: "Administration of Environmental Quality Programs", adjustmentFactor: 0 },
      { name: "Administration of Housing Programs, Urban Planning", adjustmentFactor: 0 },
      { name: "Administration of Economic Programs", adjustmentFactor: 0 },
      { name: "Space Research and Technology", adjustmentFactor: 0 },
      { name: "National Security and International Affairs", adjustmentFactor: 0 }
    ]
  }
];

/**
 * Helper function to get sub-sector objects for a given sector name.
 * @param {string} sectorName - The name of the top-level NAICS sector.
 * @returns {array} - An array of sub-sector objects [{ name: string, adjustmentFactor: number }, ...], or empty array if not found.
 */
export const getSubSectors = (sectorName) => {
  const sector = naicsSectors.find(s => s.name === sectorName);
  // Return the array of sub-sector objects directly
  return sector && sector.subSectors ? sector.subSectors : [];
};


/**
 * Gets the industry adjustment factor. MODIFIED TO ALWAYS RETURN 1.0
 * @param {string} sectorName - The name of the selected top-level sector (ignored).
 * @param {string} subSectorName - The specific name of the sub-sector (ignored).
 * @returns {number} - Always returns 1.0.
 */
export const getIndustryAdjustmentFactor = (sectorName, subSectorName) => {
  // Ya no necesitamos buscar en los datos porque queremos ignorar el ajuste.
  // Simplemente devolvemos 1.0 para que los múltiplos no se modifiquen.
  return 1.0;
};