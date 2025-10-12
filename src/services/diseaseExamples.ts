// Example interpretations for different disease prediction scenarios
import { DiseaseInterpreter } from '../services/diseaseInterpreter';

// Realistic example scenarios based on actual AI model outputs
export const exampleScenarios = [
  {
    name: "Healthy Bird - Excellent Condition",
    apiResponse: {
      prediction: "Healthy",
      confidence: 0.96
    },
    expectedResult: "Green status: Continue excellent care practices",
    description: "Bird shows clear signs of good health, bright eyes, good posture"
  },
  {
    name: "Healthy Bird - Good Condition", 
    apiResponse: {
      prediction: "Normal condition",
      confidence: 0.82
    },
    expectedResult: "Green status: Maintain monitoring routine",
    description: "Generally healthy but continue regular observations"
  },
  {
    name: "Newcastle Disease - Critical Alert",
    apiResponse: {
      prediction: "Newcastle Disease",
      confidence: 0.91
    },
    expectedResult: "Red critical: Immediate veterinary intervention required",
    description: "Highly contagious viral disease - urgent quarantine and treatment needed"
  },
  {
    name: "Coccidiosis - Parasitic Infection",
    apiResponse: {
      prediction: "Coccidiosis",
      confidence: 0.84
    },
    expectedResult: "Yellow warning: Prompt veterinary consultation needed",
    description: "Common parasitic infection affecting digestive system"
  },
  {
    name: "Respiratory Infection - Bacterial",
    apiResponse: {
      prediction: "Respiratory infection symptoms",
      confidence: 0.77
    },
    expectedResult: "Yellow warning: Monitor and schedule vet consultation",
    description: "Breathing difficulties, possible bacterial infection"
  },
  {
    name: "External Parasites - Mites",
    apiResponse: {
      prediction: "Mites infestation",
      confidence: 0.88
    },
    expectedResult: "Yellow warning: Treatment and cleaning required",
    description: "External parasites affecting feathers and skin"
  },
  {
    name: "Early Disease Signs",
    apiResponse: {
      prediction: "Abnormal condition detected",
      confidence: 0.69
    },
    expectedResult: "Yellow caution: Close monitoring and possible vet consultation",
    description: "Something doesn't look quite right - needs attention"
  },
  {
    name: "Uncertain Analysis",
    apiResponse: {
      prediction: "Unable to determine condition",
      confidence: 0.42
    },
    expectedResult: "Gray unknown: Professional assessment recommended",
    description: "Image quality or condition unclear - need better assessment"
  }
];

// Function to test all scenarios
export function testInterpretations() {
  console.log("🧪 Testing Disease Interpretation Scenarios:");
  
  exampleScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log("Input:", scenario.apiResponse);
    
    const interpretation = DiseaseInterpreter.interpretPrediction(
      scenario.apiResponse.prediction, 
      scenario.apiResponse.confidence
    );
    
    console.log("Interpretation:", {
      status: interpretation.status,
      severity: interpretation.severity,
      message: interpretation.message,
      actions: interpretation.actions.length,
      recommendations: interpretation.recommendations.length,
      confidenceLevel: interpretation.confidenceLevel
    });
    
    console.log("Expected:", scenario.expectedResult);
  });
}

// Common disease patterns the system can recognize
export const recognizedDiseases = {
  viral: [
    "Newcastle Disease",
    "Avian Influenza", 
    "Infectious Bronchitis",
    "Fowl Pox",
    "Marek's Disease"
  ],
  bacterial: [
    "Salmonella",
    "E. coli infection",
    "Fowl Cholera",
    "Infectious Coryza"
  ],
  parasitic: [
    "Coccidiosis",
    "Worms",
    "Mites",
    "Lice",
    "External parasites"
  ],
  nutritional: [
    "Nutritional deficiency",
    "Vitamin deficiency",
    "Mineral deficiency"
  ],
  environmental: [
    "Heat stress",
    "Cold stress",
    "Poor ventilation",
    "Overcrowding"
  ]
};

// Farmer-friendly explanations for common conditions
export const farmerGuide = {
  "Healthy": {
    swahili: "Kuku wako wa afya nzuri",
    explanation: "Your poultry shows good health indicators",
    maintenance: "Continue with current feeding and care practices"
  },
  "Newcastle Disease": {
    swahili: "Ugonjwa wa Newcastle",
    explanation: "Serious viral disease affecting the respiratory and nervous systems",
    urgency: "IMMEDIATE veterinary attention required - highly contagious"
  },
  "Coccidiosis": {
    swahili: "Ugonjwa wa Coccidiosis", 
    explanation: "Parasitic infection affecting the intestinal tract",
    urgency: "Requires prompt treatment to prevent spread"
  },
  "Respiratory infection": {
    swahili: "Maambukizi ya kupumua",
    explanation: "Infection affecting the breathing system",
    urgency: "Monitor closely and consider veterinary consultation"
  }
};
