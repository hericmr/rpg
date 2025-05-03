// Interface para o escritório corporativo
export interface CorporateOffice {
  LEGEND: Record<string, string>;
  OFFICE_LAYOUT: string[][];
  OFFICE_NPCS: Array<{
    id: string;
    name: string;
    position: {x: number, y: number};
    implants: string[];
    clearance: string;
    dialog: string[];
  }>;
  OFFICE_TECH: Array<{
    name: string;
    location: {x: number, y: number};
    function: string;
    securityLevel: string;
    description: string;
  }>;
  SECURITY_SYSTEMS: {
    cameraLocations: Array<{x: number, y: number}>;
    securityDrones: Array<{id: string, patrolPath: Array<{x: number, y: number}>}>;
    neuralScanners: Array<{location: {x: number, y: number}, range: number, scanType: string}>;
    emergencyProtocols: string[];
  };
  OFFICE_SECRETS: Array<{
    name: string;
    hint?: string;
    location?: {x: number, y: number};
    description: string;
  }>;
  META_DATA: {
    securityLevel: string;
    floor: number;
    department: string;
  };
}

export interface NPCData {
  id: string;
  name: string;
  position: {x: number, y: number};
  implants: string[];
  clearance: string;
  dialog: string[];
}

export const SANTOSPUNK_CORPORATE_OFFICE: CorporateOffice = {
  LEGEND: {
    "W": "wall",
    "F": "floor",
    "D": "desk",
    "C": "camera",
    "T": "terminal",
    "E": "elevator",
    "P": "plant",
    "V": "varanda"
  },
  
  OFFICE_LAYOUT: [
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "C", "W", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "W", "V", "V", "V", "P", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "W", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "D", "D", "D", "D", "D", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "D", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "D", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "W", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "F", "F", "F", "D", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "F", "W", "V", "V", "V", "V", "V", "V", "V", "V", "V", "V"],
    ["W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W", "W"]
  ],
  
  OFFICE_NPCS: [
    {
      id: 'exec_1',
      name: 'Dr. Lion',
      position: {x: 20, y: 8},
      implants: ['Neural Link', 'Enhanced Vision'],
      clearance: 'Preto',
      dialog: [
        'Zzz... Zzz... Zzz... *ronco profundo* Zzz...',
        'zzzZZ... zzzZZ... zzzZZ...*parece ate o Snorlax',
        'Zzz... Zzz... Zzz... *ronco profundo* Zzz...',
        'Zzzz dorme *como uma pedra...',
      ]
    }
  ],

  /*
  'Fique esperto... Loftjur Corporation está sob vigilância constante.',
  'Você sentiu o calor hoje? Não é normal... Nosso sistema de Geoengenharia de resfriamento não dá mais conta.',
  'Dizem que o prefeito Bruno instalou cameras e sensores até nos vasos de planta. Ninguém respira sem ser monitorado.',
  'Se o nível do mar continuar subindo, talvez o jnosso andar 87 vire o térreo...',
  'Cuidado com o que fala. As paredes têm ouvidos — e olhos também.'
  */

  OFFICE_TECH: [
    {
      name: "Terminal Neural Corporativo",
      location: {x: 3, y: 3},
      function: "Acesso direto à rede neural corporativa",
      securityLevel: "Alto",
      description: "Terminal que permite aos funcionários se conectarem diretamente à rede neural da corporação."
    }
  ],
  
  SECURITY_SYSTEMS: {
    cameraLocations: [
      {x: 1, y: 1}, {x: 18, y: 1}, {x: 1, y: 16}, {x: 18, y: 16}
    ],
    securityDrones: [],
    neuralScanners: [],
    emergencyProtocols: []
  },
  
  OFFICE_SECRETS: [
    {
      name: "Projeto Maré Eterna",
      hint: "Documentos no terminal neural do diretor",
      description: "Plano secreto para controlar completamente o fluxo de água da baía."
    }
  ],
  
  META_DATA: {
    securityLevel: "Alto",
    floor: 87,
    department: "Desenvolvimento"
  }
};

// Função para mostrar o escritório em diferentes estados/horários
export function renderOfficeState(office: CorporateOffice, timeOfDay: string): CorporateOffice {
  console.log(`Renderizando escritório da Corporação Caiçara - ${timeOfDay}`);
  
  switch(timeOfDay) {
    case "manhã":
      // Lógica para turno da manhã
      break;
    case "tarde":
      // Lógica para turno da tarde
      break;
    case "noite":
      // Lógica para operações noturnas
      break;
    case "emergência":
      // Lógica para estado de alerta
      break;
  }
  
  return office;
} 