import { TestResult } from './reportGenerator';

/**
 * Accessibility Score Calculator
 * Calculates a 0-100 score based on WCAG compliance
 */

export interface AccessibilityScore {
  score: number;           // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  passed: number;
  failed: number;
  total: number;
  weightedScore: number;
  levelScores: {
    A: { score: number; passed: number; total: number };
    AA: { score: number; passed: number; total: number };
    AAA: { score: number; passed: number; total: number };
  };
  categoryBreakdown: {
    automated: { score: number; passed: number; total: number };
    manual: { count: number };
    warnings: { count: number };
  };
}

export class AccessibilityScorer {
  /**
   * Calculate overall accessibility score (0-100)
   * 
   * Scoring methodology:
   * - Level A criteria: Weight 3 (most critical)
   * - Level AA criteria: Weight 2 (important)
   * - Level AAA criteria: Weight 1 (nice to have)
   * - Only passed and failed criteria count (not manual/warnings)
   */
  calculateScore(results: TestResult[]): AccessibilityScore {
    // Define weights for each WCAG level
    const weights = {
      'A': 3,    // Critical for basic accessibility
      'AA': 2,   // Important for legal compliance
      'AAA': 1   // Enhanced accessibility
    };

    // Separate results by type
    const testableResults = results.filter(r => 
      r.status === 'pass' || r.status === 'fail'
    );
    
    const manualResults = results.filter(r => 
      r.status === 'manual-required'
    );
    
    const warningResults = results.filter(r => 
      r.status === 'warning'
    );

    // Calculate weighted score
    let maxWeightedScore = 0;
    let currentWeightedScore = 0;

    testableResults.forEach(result => {
      const weight = weights[result.level as keyof typeof weights] || 1;
      maxWeightedScore += weight;
      
      if (result.status === 'pass') {
        currentWeightedScore += weight;
      }
    });

    // Calculate percentage score
    const score = maxWeightedScore > 0 
      ? Math.round((currentWeightedScore / maxWeightedScore) * 100)
      : 0;

    // Calculate scores by level
    const levelScores = this.calculateLevelScores(testableResults, weights);

    // Calculate category breakdown
    const categoryBreakdown = {
      automated: {
        score: score,
        passed: testableResults.filter(r => r.status === 'pass').length,
        total: testableResults.length
      },
      manual: {
        count: manualResults.length
      },
      warnings: {
        count: warningResults.length
      }
    };

    return {
      score,
      grade: this.getGrade(score),
      passed: testableResults.filter(r => r.status === 'pass').length,
      failed: testableResults.filter(r => r.status === 'fail').length,
      total: testableResults.length,
      weightedScore: currentWeightedScore,
      levelScores,
      categoryBreakdown
    };
  }

  /**
   * Calculate scores for each WCAG level
   */
  private calculateLevelScores(
    results: TestResult[], 
    weights: Record<string, number>
  ) {
    const levels = ['A', 'AA', 'AAA'] as const;
    const scores: any = {};

    levels.forEach(level => {
      const levelResults = results.filter(r => r.level === level);
      const passed = levelResults.filter(r => r.status === 'pass').length;
      const total = levelResults.length;
      
      const weight = weights[level];
      const maxScore = total * weight;
      const currentScore = passed * weight;
      
      scores[level] = {
        score: maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0,
        passed,
        total
      };
    });

    return scores;
  }

  /**
   * Convert numeric score to letter grade
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get grade color for display
   */
  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return '#2e7d32'; // Green
      case 'B': return '#558b2f'; // Light green
      case 'C': return '#f9a825'; // Yellow
      case 'D': return '#ef6c00'; // Orange
      case 'F': return '#c62828'; // Red
      default: return '#607d8b'; // Gray
    }
  }

  /**
   * Get score description
   */
  getScoreDescription(score: number): string {
    if (score >= 90) return 'Excellent accessibility - meets or exceeds standards';
    if (score >= 80) return 'Good accessibility - minor improvements needed';
    if (score >= 70) return 'Fair accessibility - some issues need attention';
    if (score >= 60) return 'Poor accessibility - significant issues present';
    return 'Critical accessibility issues - immediate action required';
  }

  /**
   * Get recommendations based on score
   */
  getRecommendations(scoreData: AccessibilityScore): string[] {
    const recommendations: string[] = [];

    // Overall score recommendations
    if (scoreData.score < 70) {
      recommendations.push('🔴 Priority: Focus on fixing critical Level A failures first');
    }

    // Level A recommendations
    if (scoreData.levelScores.A.score < 100) {
      recommendations.push(
        `⚠️  Level A: ${scoreData.levelScores.A.total - scoreData.levelScores.A.passed} critical issues remaining`
      );
    }

    // Level AA recommendations
    if (scoreData.levelScores.AA.score < 100) {
      recommendations.push(
        `📋 Level AA: ${scoreData.levelScores.AA.total - scoreData.levelScores.AA.passed} compliance issues remaining`
      );
    }

    // Manual testing reminder
    if (scoreData.categoryBreakdown.manual.count > 0) {
      recommendations.push(
        `👤 Manual Testing: ${scoreData.categoryBreakdown.manual.count} criteria require human review`
      );
    }

    // Warnings
    if (scoreData.categoryBreakdown.warnings.count > 0) {
      recommendations.push(
        `⚠️  Warnings: ${scoreData.categoryBreakdown.warnings.count} potential issues detected`
      );
    }

    // Success message
    if (scoreData.score >= 90 && scoreData.failed === 0) {
      recommendations.push('✅ Excellent work! Continue monitoring and testing regularly');
    }

    return recommendations;
  }

  /**
   * Compare two scores and show improvement
   */
  compareScores(
    previous: AccessibilityScore, 
    current: AccessibilityScore
  ): {
    scoreDelta: number;
    gradeDelta: string;
    improvement: boolean;
    summary: string;
  } {
    const scoreDelta = current.score - previous.score;
    const improvement = scoreDelta > 0;

    let summary = '';
    if (scoreDelta > 0) {
      summary = `↗ Improved by ${scoreDelta} points (${previous.grade} → ${current.grade})`;
    } else if (scoreDelta < 0) {
      summary = `↘ Decreased by ${Math.abs(scoreDelta)} points (${previous.grade} → ${current.grade})`;
    } else {
      summary = `→ No change (${current.grade})`;
    }

    return {
      scoreDelta,
      gradeDelta: `${previous.grade} → ${current.grade}`,
      improvement,
      summary
    };
  }

  /**
   * Generate score badge HTML
   */
  generateScoreBadge(scoreData: AccessibilityScore): string {
    const color = this.getGradeColor(scoreData.grade);
    const description = this.getScoreDescription(scoreData.score);

    return `
      <div class="score-badge" style="
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin: 20px 0;
      ">
        <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.1em;">
          Accessibility Score
        </div>
        <div style="font-size: 64px; font-weight: 700; margin: 12px 0;">
          ${scoreData.score}
        </div>
        <div style="font-size: 32px; font-weight: 600; margin-bottom: 8px;">
          Grade: ${scoreData.grade}
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
          ${description}
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 13px;">
          ${scoreData.passed}/${scoreData.total} automated tests passed
        </div>
      </div>
    `;
  }
}

