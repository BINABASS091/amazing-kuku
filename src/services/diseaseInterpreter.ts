// Disease prediction interpretation service
export interface DiseaseInterpretation {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendations: string[];
  actions: string[];
  confidenceLevel: 'very_high' | 'high' | 'medium' | 'low';
  confidenceDescription: string;
}

export class DiseaseInterpreter {
  static interpretPrediction(prediction: string, confidence: number): DiseaseInterpretation {
    const confidenceLevel = this.getConfidenceLevel(confidence);
    const predictionLower = prediction.toLowerCase().trim();
    
    // First, determine if this is actually a healthy or disease detection
    const isHealthyDetection = this.isHealthyDetection(predictionLower);
    const isDiseaseDetection = this.isDiseaseDetected(predictionLower);
    
    // Healthy birds - only if explicitly detected as healthy
    if (isHealthyDetection && !isDiseaseDetection) {
      return {
        status: 'healthy',
        severity: 'low',
        message: confidence > 0.9 
          ? "✅ Great news! Your poultry shows excellent health indicators! 🐔✨"
          : confidence > 0.8
          ? "✅ Your poultry appears healthy. Continue monitoring regularly."
          : confidence > 0.7
          ? "✅ Poultry seems healthy, but keep observing closely."
          : "✅ Likely healthy, but consider a closer examination for peace of mind.",
        recommendations: [
          "Maintain current feeding schedule and nutrition",
          "Continue regular cleaning and hygiene routines",
          "Monitor birds daily for any behavioral changes",
          "Ensure clean, adequate water supply",
          "Keep vaccination schedule up to date",
          "Document this healthy state with photos for future comparison"
        ],
        actions: [
          "Continue current excellent management practices",
          "Take weekly photos to track any changes",
          "Schedule routine veterinary check-ups",
          "Share successful practices with other farmers"
        ],
        confidenceLevel,
        confidenceDescription: this.getConfidenceDescription(confidence, 'healthy')
      };
    }
    
    // Disease detected - handle with appropriate urgency
    if (isDiseaseDetection) {
      const severity = this.getDIseaseSeverity(predictionLower, confidence);
      const diseaseInfo = this.getSpecificDiseaseInfo(predictionLower);
      
      return {
        status: severity === 'high' ? 'critical' : 'warning',
        severity,
        message: this.getDiseaseMessage(predictionLower, confidence, diseaseInfo),
        recommendations: this.getDiseaseRecommendations(predictionLower, severity),
        actions: this.getDiseaseActions(predictionLower, severity),
        confidenceLevel,
        confidenceDescription: this.getConfidenceDescription(confidence, 'disease')
      };
    }
    
    // Unknown or unclear prediction
    return {
      status: 'unknown',
      severity: 'medium',
      message: "Unable to determine poultry health status clearly. Please consult a veterinarian.",
      recommendations: [
        "Take additional photos from different angles",
        "Observe behavior and eating patterns",
        "Check for other symptoms",
        "Monitor temperature if possible"
      ],
      actions: [
        "Consult with a poultry veterinarian",
        "Isolate the bird if showing symptoms",
        "Document any behavioral changes"
      ],
      confidenceLevel,
      confidenceDescription: "The analysis was inconclusive. Professional assessment recommended."
    };
  }
  
  private static getConfidenceLevel(confidence: number): 'very_high' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.95) return 'very_high';
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.70) return 'medium';
    return 'low';
  }
  
  private static getConfidenceDescription(confidence: number, type: 'healthy' | 'disease'): string {
    const percentage = Math.round(confidence * 100);
    
    if (confidence >= 0.95) {
      return type === 'healthy' 
        ? `Very confident (${percentage}%) - Your poultry shows clear signs of good health`
        : `Very confident (${percentage}%) - Strong indicators suggest immediate attention needed`;
    }
    
    if (confidence >= 0.85) {
      return type === 'healthy'
        ? `High confidence (${percentage}%) - Good health indicators present`
        : `High confidence (${percentage}%) - Clear signs of concern detected`;
    }
    
    if (confidence >= 0.70) {
      return type === 'healthy'
        ? `Moderate confidence (${percentage}%) - Generally healthy, continue monitoring`
        : `Moderate confidence (${percentage}%) - Some warning signs detected`;
    }
    
    return `Lower confidence (${percentage}%) - Inconclusive results, consider professional assessment`;
  }
  
  private static isHealthyDetection(prediction: string): boolean {
    const healthKeywords = [
      'healthy', 'normal', 'good', 'fine', 'well', 'ok', 'okay', 
      'no disease', 'no infection', 'clean', 'clear'
    ];
    
    return healthKeywords.some(keyword => prediction.includes(keyword));
  }

  private static isDiseaseDetected(prediction: string): boolean {
    // Specific disease names and conditions
    const specificDiseases = [
      // Viral diseases
      'newcastle disease', 'newcastle', 'avian influenza', 'avian flu', 'bird flu',
      'infectious bronchitis', 'fowl pox', 'marek\'s disease', 'marek',
      'infectious bursal disease', 'gumboro',
      
      // Bacterial diseases  
      'salmonella', 'salmonellosis', 'fowl cholera', 'pasteurellosis',
      'infectious coryza', 'colibacillosis', 'e.coli', 'enteritis',
      
      // Parasitic diseases
      'coccidiosis', 'coccidia', 'worms', 'roundworms', 'tapeworms',
      'mites', 'lice', 'fleas', 'external parasites', 'internal parasites',
      
      // Other conditions
      'respiratory infection', 'digestive problems', 'bumblefoot',
      'sour crop', 'impacted crop', 'egg binding', 'prolapse'
    ];
    
    // General disease indicators
    const diseaseIndicators = [
      'disease', 'sick', 'ill', 'infection', 'infected', 'inflammation',
      'symptoms', 'abnormal', 'unhealthy', 'poor condition', 'distressed',
      'lesions', 'discharge', 'swelling', 'respiratory distress',
      'digestive issues', 'mortality', 'weakness', 'lethargy'
    ];
    
    // Check for specific diseases first (higher confidence)
    const hasSpecificDisease = specificDiseases.some(disease => 
      prediction.includes(disease)
    );
    
    // Check for general disease indicators
    const hasGeneralIndicators = diseaseIndicators.some(indicator => 
      prediction.includes(indicator)
    );
    
    return hasSpecificDisease || hasGeneralIndicators;
  }

  private static getSpecificDiseaseInfo(prediction: string): { name: string; type: string; urgency: string } | null {
    const diseaseDatabase = {
      'newcastle': { name: 'Newcastle Disease', type: 'viral', urgency: 'critical' },
      'avian flu': { name: 'Avian Influenza', type: 'viral', urgency: 'critical' },
      'bird flu': { name: 'Avian Influenza', type: 'viral', urgency: 'critical' },
      'fowl pox': { name: 'Fowl Pox', type: 'viral', urgency: 'moderate' },
      'marek': { name: 'Marek\'s Disease', type: 'viral', urgency: 'high' },
      'coccidiosis': { name: 'Coccidiosis', type: 'parasitic', urgency: 'moderate' },
      'salmonella': { name: 'Salmonellosis', type: 'bacterial', urgency: 'high' },
      'respiratory infection': { name: 'Respiratory Infection', type: 'bacterial', urgency: 'moderate' },
      'worms': { name: 'Intestinal Worms', type: 'parasitic', urgency: 'low' },
      'mites': { name: 'External Mites', type: 'parasitic', urgency: 'low' }
    };
    
    for (const [key, info] of Object.entries(diseaseDatabase)) {
      if (prediction.includes(key)) {
        return info;
      }
    }
    
    return null;
  }
  
  private static getDIseaseSeverity(prediction: string, confidence: number): 'low' | 'medium' | 'high' {
    // Critical/High severity diseases - immediate action required
    const criticalDiseases = [
      'newcastle', 'avian flu', 'bird flu', 'fowl cholera', 'highly pathogenic',
      'infectious bursal disease', 'gumboro', 'severe', 'critical', 'emergency'
    ];
    
    // Medium severity diseases - prompt attention needed
    const moderateDiseases = [
      'coccidiosis', 'salmonella', 'respiratory infection', 'fowl pox',
      'infectious bronchitis', 'marek', 'infectious coryza', 'enteritis'
    ];
    
    // Low severity conditions - monitoring and care needed
    const mildConditions = [
      'mites', 'lice', 'worms', 'minor', 'mild', 'early stage', 'beginning'
    ];
    
    // Check for critical diseases
    if (criticalDiseases.some(disease => prediction.includes(disease))) {
      return 'high';
    }
    
    // Check for moderate diseases
    if (moderateDiseases.some(disease => prediction.includes(disease))) {
      // Upgrade to high if very confident
      return confidence > 0.9 ? 'high' : 'medium';
    }
    
    // Check for mild conditions
    if (mildConditions.some(condition => prediction.includes(condition))) {
      return 'low';
    }
    
    // Default assessment based on confidence level and general indicators
    if (confidence > 0.9) {
      // High confidence in disease detection
      if (prediction.includes('disease') || prediction.includes('infection')) {
        return 'medium'; // Conservative but attentive
      }
    }
    
    if (confidence > 0.8) {
      return 'medium';
    }
    
    if (confidence > 0.7) {
      return 'low';
    }
    
    // Very low confidence - treat as uncertain
    return 'low';
  }
  
  private static getDiseaseMessage(
    prediction: string, 
    confidence: number, 
    diseaseInfo: { name: string; type: string; urgency: string } | null = null
  ): string {
    const severity = this.getDIseaseSeverity(prediction, confidence);
    const confidenceText = Math.round(confidence * 100);
    
    if (diseaseInfo) {
      // Specific disease detected
      if (severity === 'high' || diseaseInfo.urgency === 'critical') {
        return `🚨 CRITICAL: ${diseaseInfo.name} detected with ${confidenceText}% confidence. This ${diseaseInfo.type} disease requires IMMEDIATE veterinary intervention!`;
      }
      
      if (severity === 'medium' || diseaseInfo.urgency === 'high') {
        return `⚠️ ALERT: ${diseaseInfo.name} identified with ${confidenceText}% confidence. This ${diseaseInfo.type} condition needs prompt veterinary attention.`;
      }
      
      return `⚠️ CAUTION: Possible ${diseaseInfo.name} detected (${confidenceText}% confidence). Monitor closely and consider veterinary consultation for this ${diseaseInfo.type} condition.`;
    }
    
    // General disease detection without specific identification
    if (severity === 'high') {
      return `🚨 SERIOUS CONCERN: Disease indicators detected with ${confidenceText}% confidence. Immediate veterinary examination required!`;
    }
    
    if (severity === 'medium') {
      return `⚠️ HEALTH ISSUE: Potential disease signs identified with ${confidenceText}% confidence. Schedule veterinary consultation within 24-48 hours.`;
    }
    
    return `⚠️ MINOR CONCERN: Some health irregularities detected with ${confidenceText}% confidence. Monitor closely and consider veterinary advice if symptoms persist.`;
  }
  
  private static getDiseaseRecommendations(_prediction: string, severity: 'low' | 'medium' | 'high'): string[] {
    const baseRecommendations = [
      "Isolate affected birds immediately",
      "Disinfect feeding and watering equipment",
      "Increase cleaning frequency",
      "Monitor all birds for similar symptoms"
    ];
    
    if (severity === 'high') {
      return [
        "URGENT: Contact veterinarian immediately",
        "Quarantine entire flock if necessary",
        "Stop introducing new birds",
        "Document all symptoms with photos",
        ...baseRecommendations
      ];
    }
    
    if (severity === 'medium') {
      return [
        "Schedule veterinary consultation within 24-48 hours",
        "Monitor affected birds closely",
        "Check vaccination records",
        ...baseRecommendations
      ];
    }
    
    return [
      "Observe birds for 24-48 hours",
      "Consider veterinary consultation if symptoms persist",
      "Review recent changes in diet or environment",
      ...baseRecommendations
    ];
  }
  
  private static getDiseaseActions(_prediction: string, severity: 'low' | 'medium' | 'high'): string[] {
    if (severity === 'high') {
      return [
        "Call veterinarian immediately",
        "Prepare to implement emergency protocols",
        "Document timeline of symptoms",
        "Prepare affected birds for examination"
      ];
    }
    
    if (severity === 'medium') {
      return [
        "Schedule veterinary appointment",
        "Take additional photos for documentation",
        "Monitor eating and drinking behavior",
        "Check other birds in the flock"
      ];
    }
    
    return [
      "Continue daily monitoring",
      "Take photos to track progression",
      "Research similar cases online",
      "Consult experienced farmers if available"
    ];
  }
}
