// These values are based on regulations typically around Reiwa 5 (2023)
// and should be verified for May 2025 if official updates are available.

// 休業開始時賃金日額の上限・下限 (Daily wage cap at start of leave for standard benefit)
// Source: Example from Hello Work, as of Aug 1, 2023 (Reiwa 5)
export const WAGE_DAILY_UPPER_LIMIT = 16860; // 円 (Yen) - Standard benefit (67%/50%)
export const WAGE_DAILY_LOWER_LIMIT = 2746;  // 円 (Yen) - Applies to both standard and PWASG base wage

// 給付率 (Benefit rates for standard benefit)
export const BENEFIT_RATE_FIRST_PERIOD = 0.67; // 67%
export const BENEFIT_RATE_SECOND_PERIOD = 0.50; // 50%

// 最初の給付期間の日数 (Duration of the first benefit period)
export const DAYS_IN_FIRST_PERIOD_THRESHOLD = 180; // 日 (days)

// 支給上限額（月額） (Monthly benefit cap for standard benefit)
// Source: Example from Hello Work, as of Aug 1, 2023 (Reiwa 5)
export const MONTHLY_CAP_FIRST_PERIOD_RATE = 310143; // 円 (Yen) - for periods including the first 180 days
export const MONTHLY_CAP_SECOND_PERIOD_RATE = 231450; // 円 (Yen) - for periods after the first 180 days

// 標準的な月の日数（賃金日額計算や上限適用時の参照用）
export const DAYS_PER_MONTH_FOR_CALC = 30; // 日 (days)

export const DISCLAIMER_TEXT = `
  この計算結果はあくまで概算です。入力された情報と、令和7年4月1日施行予定の制度情報（特に「出生後休業支援給付金」）および令和5年8月1日現在の一般的な育児休業給付金制度情報に基づいて計算しています。
  実際の支給額は、個別の状況や申請時期の法令により異なる場合があります。
  正確な金額や詳細については、必ず管轄のハローワークや社会保険労務士にご確認ください。
`;

// --- 出生後休業支援給付金 (Postpartum Work Absence Support Grant - PWASG) Constants ---
// Based on MHLW document "「出生後休業支援給付金」を創設します" (Feb 2025, effective Apr 1, 2025)
export const PWASG_NAME = "出生後休業支援給付金";
export const PWASG_ADDITIONAL_RATE = 0.13; // 13% additional top-up
export const PWASG_MAX_DAYS = 28; // 日 (days) - Maximum days for the 13% top-up
export const PWASG_WAGE_DAILY_UPPER_LIMIT = 15690; // 円 (Yen) - Specific daily wage cap for the 13% calculation
export const PWASG_APPLICANT_MIN_LEAVE_DAYS = 14; // 日 (days) - Applicant's own leave must be at least this many days

export const PWASG_APPLICATION_CHECKBOX_LABEL = `「${PWASG_NAME}（上乗せ給付）」の利用を希望する`;
export const PWASG_CONDITIONS_TEXT = `
  「${PWASG_NAME}」は、子の出生直後の休業に対し、既存の育児休業給付金等に加えて支給される上乗せ給付です。
  以下の主な条件を満たす場合に、最大${PWASG_MAX_DAYS}日間の休業について、賃金日額の${PWASG_ADDITIONAL_RATE * 100}%相当が追加で給付され、既存の給付と合わせて最大80%（手取り10割相当）の給付を目指します。

  主な支給条件:
  1. 申請者自身が、子の出生後8週間以内などに開始する産後パパ育休（出生時育児休業給付金）または育児休業（育児休業給付金）を、通算${PWASG_APPLICANT_MIN_LEAVE_DAYS}日以上取得すること。
     （本計算機では、入力された育休期間が${PWASG_APPLICANT_MIN_LEAVE_DAYS}日以上であることを確認します。）
  2. 配偶者も、子の出生後8週間以内などに通算14日以上の育児休業を取得していること（または、配偶者の育休取得を要しない特定の免除事由に該当すること）。
     （下のチェックボックスで該当状況を選択してください。）

  ※ この追加給付の計算に用いる賃金日額には、専用の上限額（${new Intl.NumberFormat('ja-JP').format(PWASG_WAGE_DAILY_UPPER_LIMIT)}円）が適用されます。
  ※ その他の詳細条件については、厚生労働省の資料やハローワークにご確認ください。
`;

export const PWASG_SPOUSE_CONDITION_CHECKBOX_LABEL = "配偶者が上記2の条件を満たす（14日以上の育休取得等）、または配偶者要件の免除対象である";
export const PWASG_SPOUSE_CONDITION_DESCRIPTION_TEXT = `
  「${PWASG_NAME}」の受給には、原則として配偶者も所定の育児休業を取得する必要があります。
  配偶者がいない、DV被害で別居中、配偶者が自営業・無業者であるなど、特定の免除事由に該当する場合もこの条件を満たすものとして扱われます。
  詳細はハローワーク等にご確認ください。
`;

// Renaming old constants to avoid confusion if they were used with a different meaning
export const OLD_POSTPARTUM_SUPPORT_GRANT_MAX_DAYS = 28; // Kept for reference if any part of old logic relied on it, but PWASG_MAX_DAYS is the new one.
export const OLD_POSTPARTUM_SUPPORT_GRANT_CONDITIONS_TEXT = `
  子の出生後8週間以内に取得する、最大28日間の休業が対象です（2回まで分割可）。
  原則として休業中の就業はできませんが、労使の合意があり、かつ就業がごく短期間（例：休業期間中の所定労働日・時間の半分以下、かつ10日または80時間以内など）である場合に限り、給付の対象となることがあります。
  これらの条件を満たす場合にチェックしてください。この給付は育児休業給付（最初の180日間と同率の${(BENEFIT_RATE_FIRST_PERIOD * 100).toFixed(0)}%）の一部として計算・表示されます。
`;
// The old interpretation of "PostpartumSupportGrant" as part of the 67% is now superseded by the new 13% add-on PWASG.
// The constants POSTPARTUM_SUPPORT_GRANT_MAX_DAYS and POSTPARTUM_SUPPORT_GRANT_CONDITIONS_TEXT
// are effectively replaced by PWASG_ prefixed constants for the new benefit logic.
// For clarity, I've prefixed the old constants with OLD_ if they are no longer the primary source of truth for the "Postpartum Support Grant" logic,
// assuming that name now refers to the new 13% add-on "出生後休業支援給付金".
// The component `PostpartumSupportGrantCheckbox` will now use `PWASG_APPLICATION_CHECKBOX_LABEL` and `PWASG_CONDITIONS_TEXT`.
// The old constants related to the previous interpretation are no longer directly used by the PWASG logic.
