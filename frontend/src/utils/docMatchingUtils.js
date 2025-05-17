// frontend/src/utils/docMatchingUtils.js

const SYNONYM_MAP = {
  coastal: ['coastal', 'oceanfront', 'marine', 'near the sea'],
  flood: [
    'flooding',
    'flood',
    'inundation',
    'deluge',
    'overflow',
    'flash flood',
    'water inundation',
  ],
  drought: [
    'drought',
    'water scarcity',
    'dry spell',
    'arid conditions',
    'water shortage',
    'prolonged dry period',
    'aridity',
  ],
  heatwave: [
    'heatwave',
    'heat wave',
    'extreme heat',
    'hot spell',
    'heat spell',
    'temperature spike',
    'hot snap',
  ],
  'sea level rise': [
    'sea level rise',
    'rising seas',
    'ocean level rise',
    'tidal rise',
    'coastal inundation',
    'marine encroachment',
    'tidal increase',
  ],
  landslide: [
    'landslide',
    'mudslide',
    'debris flow',
    'slope failure',
    'earth slide',
    'land collapse',
    'debris avalanche',
  ],

  'height limit': [
    'height limit',
    'max height',
    'height cap',
    'elevation cap',
    'building height restriction',
    'height zoning',
    'vertical restriction',
  ],
  wetland: [
    'wetland',
    'marsh',
    'bog',
    'swamp',
    'fen',
    'peatland',
    'wet meadow',
  ],
  Wildfire: [
    'fire',
    'wildfire',
    'wildfires',
    'forest fire',
    'bush fire',
    'wild fire',
    'brush fire',
    'wilderness fire',
  ],
  'public building': [
    'public building',
    'civic infrastructure',
    'government facility',
    'community center',
    'municipal facility',
    'public facility',
    'civic building',
  ],
  residential: [
    'residential',
    'housing',
    'dwelling',
    'residential development',
    'living spaces',
    'residences',
    'housing project',
  ],
  'commercial complex': [
    'commercial complex',
    'retail center',
    'shopping mall',
    'business complex',
    'commercial development',
    'commercial facility',
    'retail complex',
  ],

  coastal: [
    'coastal',
    'oceanfront',
    'marine',
    'seaside',
    'shoreline',
    'littoral',
    'near the sea',
  ],
  inland: [
    'inland',
    'interior',
    'continental',
    'landlocked',
    'upland',
    'interior region',
  ],
  mountain: [
    'mountain',
    'alpine',
    'montane',
    'highland',
    'mountainous region',
    'upland',
  ],

  'small-scale site': [
    'small-scale site',
    'site-level',
    'individual site',
    'single site',
    'localized area',
    'parcel scale',
  ],
  'medium-scale site': [
    'medium-scale site',
    'building-scale',
    'structure-scale',
    'building-level',
    'mid-scale site',
    'site scale',
  ],
  'large-scale region': [
    'large-scale region',
    'regional scale',
    'campus-scale',
    'district-scale',
    'macro scale',
    'broad area',
    'large area',
  ],
};
const CERT_MAP = {
  hazards: [
    {
      hazard: [
        'wildfire',
        'forest fire',
        'bush fire',
        'wild fire',
        'brush fire',
        'wilderness fire',
      ],
      recommendations: [
        {
          title: 'Construction Design and Materials in Wildland Areas',
          numInterconnections: 4,
          description:
            'Follow the guidelines of NFPA 1144: Standard for Reducing Structure Ignition Hazards from Wildland Fire.',
          sources: [
            {
              label:
                'RELi Version 2.0, HA Req. 4.0 – Safer Design for Extreme Weather, Wildfire + Seismic Events',
              url: null,
            },
          ],
        },
        {
          title: 'Deploy Portable Air Cleaner(s)',
          numInterconnections: 7,
          description:
            'Portable air cleaners can be used alone or, ideally, with central air filtration to remove particulate pollution (1). Units must be appropriately sized to room volume/area and should not release ions, reactants, or other molecules to clean air (2,3).',
          sources: [
            {
              label:
                'EPA Wildfire Smoke Course – Preparing for Fire Season: Air Cleaner',
              url: 'https://www.epa.gov/wildfire-smoke-course/preparing-fire-season#aircleaner',
            },
          ],
        },
        {
          title: 'Differential Pressure Control',
          numInterconnections: 8,
          description:
            'Positive/negative pressure ventilation systems control the flow of air. Engineer positive pressure in entryways to prevent outdoor air pollutants from infiltrating (1,2). Engineer negative pressure to manage indoor pollutant sources (3-6).',
          sources: [
            {
              label: 'NIH – Ventilation Systems Study (PMC5858299)',
              url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5858299/',
            },
          ],
        },
        {
          title: 'Emergency Care and Supplies, Water, Food, Communications',
          numInterconnections: 7,
          description:
            'Provide safety for occupants during periods of disaster and/or emergency. High-Demand/Short-Supply items, Enhanced Emergency Sanitation, Provide Portable Emergency Lighting.',
          sources: [
            {
              label:
                'Capital Markets Partnership PDF – page 23 (local chrome-extension path)',
              url: null,
            },
          ],
        },
        {
          title: 'Emergency Preparedness',
          numInterconnections: 7,
          description:
            'Provide fundamental safety for facility occupants during common emergencies for at least a 96-hour period (four days). Stock and provide a First Aid Kit. Provide First Aid and CPR Training. Provide Emergency Preparedness Supplies. Provide Fundamental Communication Capacity + Equipment.',
          sources: [
            {
              label:
                'Capital Markets Partnership PDF – page 18 (local chrome-extension path)',
              url: null,
            },
          ],
        },
        {
          title: 'Humidity Control via Mechanical Systems',
          numInterconnections: 11,
          description:
            'Design mechanical systems to maintain optimum relative humidity levels between 30 % and 60 % at all times by adding or removing moisture from the air.',
          sources: [
            {
              label: 'WELL v2 – Humidity Control',
              url: 'https://v2.wellcertified.com/en/wellv2/thermal%20comfort/feature/7',
            },
          ],
        },
        {
          title: 'Increase Building Filtration',
          numInterconnections: 8,
          description:
            'Use media filters (> MERV 8) to reduce particulate pollution when the project is within 1500 ft of a major roadway or waste site, or when in an area with increased risk of exposure to wildfire smoke (1-4). More frequent filter replacement/maintenance is required (1).',
          sources: [
            {
              label: 'WELL v2 – Air Feature 12',
              url: 'https://v2.wellcertified.com/en/wellv2/air/feature/12',
            },
          ],
        },
        {
          title: 'Indoor Air Quality Management Plan During Construction',
          numInterconnections: 10,
          description:
            'To promote the well-being of construction workers and building occupants by minimizing indoor air-quality problems associated with construction and renovation, develop and implement an Indoor Air Quality (IAQ) Management Plan for the construction and pre-occupancy phases of the building. The plan should address SMACNA IAQ control measures, protect absorptive materials, prohibit operation of permanent HVAC without proper filtration, replace filters before occupancy, and prohibit smoking inside the building and within 25 ft of building openings during construction.',
          sources: [
            {
              label: 'LEED I+C v4.1 – EQ Credit',
              url: 'https://www.usgbc.org/credits/commercial-interiors-retail-commercial-interiors-hospitality-commercial-interiors/v4?eq113',
            },
          ],
        },
        {
          title: 'Operable Windows',
          numInterconnections: 6,
          description:
            'Encourage occupants to introduce natural ventilation when outdoor air is favorable (1). Projects within 1500 ft of major roads or exposed to wildfire smoke should inform occupants to keep windows closed during peak traffic or wildfire events (1-5).',
          sources: [
            {
              label: 'WELL v2 – Air Feature 13',
              url: 'https://v2.wellcertified.com/en/wellv2/air/feature/13',
            },
          ],
        },
        {
          title: 'Ultraviolet Air Treatment for Microbial Contaminants',
          numInterconnections: 5,
          description:
            'Air-conditioning systems, specifically cooling coils, have high levels of moisture condensation that can develop mold and shed particles into indoor air. Install Ultraviolet Germicidal Irradiation (UVGI) systems and conduct regular inspections of cooling systems to reduce or eliminate growth of microbes and mold.',
          sources: [
            {
              label: 'WELL v2 – Microbe and Mold Control (Air Feature 14)',
              url: 'https://v2.wellcertified.com/en/wellv2/air/feature/14',
            },
          ],
        },
      ],
    },
    {
      hazard: [
        'extreme heat',
        'heatwave',
        'heat wave',
        'hot spell',
        'heat spell',
        'temperature spike',
        'hot snap',
      ],
      recommendations: [
        {
          title: 'Backup Power',
          numInterconnections: 5,
          description:
            'Provide a reliable power source for protection and operation of essential services like HVAC operations, security etc. during power outages from the grid. Having a reliable backup power source is particularly important for communities vulnerable to extreme weather events, such as heat waves. (1)',
          sources: [
            {
              label:
                'U.S. Green Buildings Council. RELi, v2.0. (202. Fundamental Emergency Operations: Back-up Power & Operations)',
              url: 'https://www.gbci.org/sites/default/files/RELi%20mandatory%20users%20guide.pdf',
            },
          ],
        },
        {
          title: 'Emergency Care and Supplies, Water, Food, Communications',
          numInterconnections: 7,
          description:
            'Provide safety for occupants during periods of disaster and/or emergency. High-Demand/Short-Supply items, Enhanced Emergency Sanitation, Provide Portable Emergency Lighting.',
          sources: [
            {
              label:
                'Page 23 of capitalmarketspartnership.com PDF (chrome-extension local path)',
              url: null,
            },
          ],
        },
        {
          title: 'Emergency Preparedness',
          numInterconnections: 7,
          description:
            'Provide fundamental safety for facility occupants during common emergencies for at least a 96-hour period (four days). Stock and provide a First Aid Kit. Provide First Aid Training and CPR Training. Provide Emergency Preparedness Supplies. Provide Fundamental Communication Capacity + Equipment.',
          sources: [
            {
              label:
                'Page 18 of capitalmarketspartnership.com PDF (chrome-extension local path)',
              url: null,
            },
          ],
        },
        {
          title: 'Heat Island Mitigation in Outdoor Space',
          numInterconnections: 5,
          description:
            'Implement practices to reduce the heat-island effect. Implementing practices to reduce the heat-island effect, such as installing high-albedo pavement and integrating vegetation on roofs, building walls, and across the surrounding area, cools on-site air temperature, which has been shown to reduce heat-related mortality, incidence of heat stroke, and heat-related hospitalization rates, particularly for vulnerable populations. Implement a qualifying heat-island-mitigation practice(s) on the building/lot surfaces. Qualifying practices include but are not limited to the following: green roofs; green walls; heat-resistant construction materials; high-albedo surfaces on roofs (e.g., white roofs, light-colored concrete); non-paved natural surfaces on pathways and walkways (wood, dirt, grass, etc.); white and light-colored concrete or pavement on paved pathways, roadways, and parking areas; shading devices over paved areas such as surface parking areas, sidewalks, or pedestrian plazas; vegetation coverage on paved pathways, roadways, and surface parking areas as green open space, such as parks.',
          sources: [
            {
              label: 'Fitwel, 03 Outdoor Space – Heat Mitigation',
              url: 'https://helpcenter.fitwel.org/hc/en-us/articles/12894028540052-03-Outdoor-Space-Heat-Island-Mitigation',
            },
          ],
        },
        {
          title: 'Humidity Control via Mechanical Systems',
          numInterconnections: 11,
          description:
            'Design mechanical systems to maintain optimum relative humidity levels between 30 % and 60 % at all times by adding or removing moisture from the air.',
          sources: [
            {
              label: 'WELL v2 Humidity Control',
              url: 'https://v2.wellcertified.com/en/wellv2/thermal%20comfort/feature/7',
            },
          ],
        },
        {
          title: 'Use Radiant Heating',
          numInterconnections: 5,
          description:
            'Utilize radiant-heating systems by supplying heat directly through surrounding surfaces of floors, walls, or ceilings in lieu of forced-air heating/cooling.',
          sources: [
            {
              label: 'WELL v2 – Radiant Thermal Comfort',
              url: 'https://v2.wellcertified.com/en/wellv2/thermal%20comfort/feature/5',
            },
          ],
        },
      ],
    },
    {
      hazard: [
        'Drought',
        'dry spell',
        'water scarcity',
        'arid conditions',
        'water shortage',
        'irrigation shortage',
        'prolonged dry period',
        'aridity',
      ],
      recommendations: [
        {
          title: 'Water Use Reduction – Appliances',
          numInterconnections: 3,
          description:
            'Install appliances and equipment within the project scope that meet the requirements: Residential clothes washers to be Energy Star rated or performance equivalent; Commercial clothes washers to be CEE Tier 3/4; Residential dishwashers to be Energy Star rated or performance equivalent; pre-rinse spray valves to be ≤ 1.3 gpm (4.9 lpm); Ice machines to be Energy Star rated or performance equivalent AND use either air-cooled or closed-loop cooling, such as chilled or condenser water system.',
          sources: [
            {
              label:
                'LEED BD+C: New Construction, v4, Indoor Water Use Reduction',
              url: 'https://www.usgbc.org/credits/new-construction-core-and-shell-data-centers-new-construction-warehouse-and-distribution?return=/credits/New%20Construction/v4/Water%20Efficiency',
            },
          ],
        },
        {
          title: 'Water Use Reduction – Landscape',
          numInterconnections: 2,
          description:
            'Reduce potable water use with any combination of the following items and methods: Design the site to maximize the use of captured stormwater for landscape elements; Design the plantings, soils, and other features to be self-sustaining with natural precipitation only; Limit water use to time of planting only; Plant at the optimal season for your region to reduce or eliminate the need for watering for establishment; If turfgrasses are to be used, they should be regionally appropriate and minimize post-establishment requirements for irrigation; Improve water-retention capacity of soil by increasing organic matter (e.g., adding compost); Design irrigation systems in such a way that trees, shrubs, and ground cover are irrigated in separate hydrozones so watering can be discontinued by zone as plants become established; Use high-efficiency equipment (e.g., drip irrigation) and climate-based controllers for irrigation systems; Reuse graywater, captured rainwater, HVAC blowdown, or condensate water for irrigation to decrease potable water use and to create a net benefit to the local watershed by making the landscape part of the natural water-treatment process; If graywater or wastewater is to be recycled for landscape irrigation, consider conducting chemical tests to determine suitability for reuse on intended vegetation; Use water treated and conveyed by a public agency specifically for non-potable uses.',
          sources: [
            {
              label:
                'SITES Rating System, v2, Site Design – Water, Reduce water use for landscape irrigation',
              url: null,
            },
          ],
        },
        {
          title: 'Water Use Reduction – Plumbing Fixtures',
          numInterconnections: 3,
          description:
            'Use low-flow plumbing fixtures that include a WaterSense label.',
          sources: [
            {
              label:
                'LEED BD+C: New Construction, v4, Indoor Water Use Reduction',
              url: 'https://www.usgbc.org/credits/new-construction-core-and-shell-data-centers-new-construction-warehouse-and-distribution?return=/credits/New%20Construction/v4/Water%20Efficiency',
            },
          ],
        },
        {
          title: 'Water Use Reduction – Process Water',
          numInterconnections: 2,
          description:
            'Install processes within the project scope that meet the requirements: Heat rejection and cooling require no once-through cooling with potable water for any equipment or appliances that reject heat; Cooling towers and evaporative condensers to be equipped with makeup water meters, conductivity controllers and overflow alarms, efficient drift eliminators that reduce drift to a maximum of 0.002 % of recirculated water volume for counter-flow towers, and 0.005 % of recirculated water flow for cross-flow towers.',
          sources: [
            {
              label:
                'LEED BD+C: New Construction, v4, Indoor Water Use Reduction',
              url: 'https://www.usgbc.org/credits/new-construction-core-and-shell-data-centers-new-construction-warehouse-and-distribution?return=/credits/New%20Construction/v4/Water%20Efficiency',
            },
          ],
        },
      ],
    },
  ],
};

/**
 * @param {string} docContent   - chunk 原文
 * @param {string[]} userTerms  - 用户在 context + query 中出现的关键词（已全转小写）
 *
 * 返回：
 * {
 *   matchedLabels:     ['flood', 'wildfire', ...]           // 该 chunk 命中的所有同义词标签
 *   emphasizedLabels:  ['flood']                            // 与用户输入直接相关的，需要高亮
 * }
 */
function getSynonymMatches(docContent = '', userTerms = []) {
  const textLower = docContent.toLowerCase();

  /** ---------------------------
   * ① 先找出文档里命中的所有 label:
   * 检查小写后的 docContent 是否含有任何 label 的同义词，如有，这个label 就命中
   *    • 这里的 label 是指 synonymMap 的 key
   *    • 找到的 label 直接 push 到 highlightLabels
   * --------------------------- */
  const highlightLabels = [];
  Object.entries(SYNONYM_MAP).forEach(([label, synonyms]) => {
    if (
      synonyms.some((s) => textLower.includes(s.toLowerCase())) &&
      !highlightLabels.includes(label)
    ) {
      highlightLabels.push(label);
    }
  });

  /** ---------------------------
   * ② 根据用户「关注词」计算需要加重显示的 label
   *    • 关注词 = query 里的词 + context 里结构化输入的值
   *    • 先把每个同义词映射回所属 label，再取交集
   * --------------------------- */
  const termToLabel = {}; // synonym → label
  Object.entries(SYNONYM_MAP).forEach(([label, synonyms]) => {
    synonyms.forEach((s) => {
      termToLabel[s.toLowerCase()] = label;
    });
  });

  const emphasizedSet = new Set();
  userTerms
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .forEach((t) => {
      if (termToLabel[t]) emphasizedSet.add(termToLabel[t]);
    });

  return {
    highlightLabels,
    emphasizedLabels: [...emphasizedSet], // 转成数组，便于前端判断
  };
}

/**
 * Given a page content, find all the matched certification recommendations
 * by checking if the content contains any of the hazard synonyms, and
 * if the content matches any of the recommendation titles, descriptions
 * or source labels.
 *
 * @param   {string}  pageContent  - The content of the page to match against
 * @return  {Object[]}  An array of matched hazards, each containing the hazard
 *                      synonyms and an array of matched recommendations
 * 返回大概这样：
 [
  {
    // 第一个匹配到的灾害（野火）及其建议
    hazard: [
      'wildfire',
      'forest fire',
      'bush fire',
      'wild fire',
      'brush fire',
      'wilderness fire'
    ],
    recommendations: [
      {
        title: 'Construction Design and Materials in Wildland Areas',
        numInterconnections: 4,
        description: 'Follow the guidelines of NFPA 1144: Standard for Reducing Structure Ignition Hazards from Wildland Fire.',
        sources: [
          {
            label: 'RELi Version 2.0, HA Req. 4.0 – Safer Design for Extreme Weather, Wildfire + Seismic Events',
            url: null
          }
        ]
      },
      {
        title: 'Deploy Portable Air Cleaner(s)',
        numInterconnections: 7,
        description: 'xxxxxxx',
        sources: [
          {
            label: 'xxxxxxxxxx',
            url: 'xxxxxxxxx'
          }
        ]
      }
    ]
  },
  {
    // 第二个匹配到的灾害（极端高温）及其建议
    hazard: [
      'extreme heat',
      ...
    ],
    recommendations: [
      {
        title: 'Backup Power',
        numInterconnections: 5,
        description: 'xxxxxxxxxx',
        sources: [
          {
            label: 'xxxxxxxxxxx',
            url: 'xxxxxxxxx'
          }
        ]
      }
    ]
  }
]
 */
function findCertificationMatches(pageContent = '') {
  const text = pageContent.toLowerCase();
  const matchedHazards = [];

  CERT_MAP.hazards.forEach((hzObj) => {
    const hasHazard = hzObj.hazard.some((h) => text.includes(h.toLowerCase()));
    if (!hasHazard) return;

    const recs = hzObj.recommendations.filter((rec) => {
      // 标题直接命中
      if (rec.title && text.includes(rec.title.toLowerCase())) return true;

      // 描述：取前 5 个 5+ 字母的关键词，命中 >=2 认为匹配
      if (rec.description) {
        const words = rec.description
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 4)
          .slice(0, 5);
        const hits = words.filter((w) => text.includes(w)).length;
        if (hits >= 2) return true;
      }

      // 来源 label 命中
      if (rec.sources) {
        return rec.sources.some(
          (s) => s.label && text.includes(s.label.toLowerCase().slice(0, 20)) // 只取前 20 字符
        );
      }
      return false;
    });

    if (recs.length)
      matchedHazards.push({ hazard: hzObj.hazard, recommendations: recs });
  });

  return matchedHazards;
}

export { getSynonymMatches, findCertificationMatches };
