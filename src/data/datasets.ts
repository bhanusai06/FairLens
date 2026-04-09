// Demo datasets for FairLens — pre-loaded for judges
export const DEMO_DATASETS = {
  hiring: {
    id: 'hiring',
    name: 'Hiring Decisions',
    description: 'Software engineer applicant screening dataset',
    icon: '💼',
    rows: 500,
    color: '#FF4D6D',
    protectedAttributes: ['gender', 'age', 'ethnicity'],
    csvData: `id,name,gender,age,ethnicity,years_experience,education,employment_gap_months,gpa,interview_score,skills_test,decision
1,Alex Johnson,Male,28,White,5,Bachelor,0,3.8,85,90,Hired
2,Maria Garcia,Female,29,Hispanic,5,Bachelor,6,3.9,84,91,Rejected
3,James Smith,Male,32,White,8,Master,0,3.7,88,87,Hired
4,Priya Patel,Female,30,South Asian,8,Master,3,3.9,89,92,Rejected
5,David Lee,Male,25,Asian,3,Bachelor,0,3.6,80,85,Hired
6,Sarah Williams,Female,26,White,3,Bachelor,12,3.7,81,86,Rejected
7,Michael Brown,Male,35,Black,10,Master,0,3.5,82,83,Hired
8,Aisha Johnson,Female,34,Black,10,Master,4,3.8,83,88,Rejected
9,Robert Davis,Male,27,White,4,Bachelor,0,3.6,79,82,Hired
10,Emily Chen,Female,28,Asian,4,Bachelor,2,3.8,80,87,Rejected
11,Daniel Wilson,Male,31,White,7,Master,0,3.7,86,89,Hired
12,Fatima Hassan,Female,32,Middle Eastern,7,Master,8,3.9,87,90,Rejected
13,Christopher Moore,Male,24,White,2,Bachelor,0,3.5,76,79,Hired
14,Sofia Rodriguez,Female,25,Hispanic,2,Bachelor,5,3.6,75,80,Rejected
15,Kevin Taylor,Male,38,White,13,PhD,0,3.9,92,95,Hired
16,Rachel Anderson,Female,37,White,13,PhD,6,4.0,93,96,Rejected
17,Jason Martin,Male,26,Black,3,Bachelor,0,3.5,78,81,Hired
18,Naomi Thompson,Female,27,Black,3,Bachelor,3,3.6,77,82,Rejected
19,Ryan Jackson,Male,30,White,6,Master,0,3.8,85,88,Hired
20,Amy White,Female,31,White,6,Master,9,3.9,86,89,Rejected
21,Justin Harris,Male,29,Hispanic,5,Bachelor,0,3.4,77,80,Hired
22,Laura Martinez,Female,28,Hispanic,5,Bachelor,4,3.5,76,81,Rejected
23,Brandon Clark,Male,33,White,9,Master,0,3.6,84,87,Hired
24,Kimberly Lewis,Female,34,White,9,Master,2,3.7,85,88,Rejected
25,Nathan Robinson,Male,36,Asian,11,PhD,0,3.8,88,91,Hired
26,Stephanie Walker,Female,35,Asian,11,PhD,7,3.9,89,92,Rejected
27,Tyler Hall,Male,22,White,1,Bachelor,0,3.3,72,75,Hired
28,Ashley Young,Female,23,White,1,Bachelor,6,3.4,71,76,Rejected
29,Ethan Allen,Male,27,Black,4,Bachelor,0,3.6,80,83,Hired
30,Danielle King,Female,26,Black,4,Bachelor,2,3.7,79,84,Rejected`,
  },

  loan: {
    id: 'loan',
    name: 'Loan Approvals',
    description: 'Bank loan application decision dataset',
    icon: '🏦',
    rows: 450,
    color: '#FFB347',
    protectedAttributes: ['race', 'gender', 'age', 'zip_code'],
    csvData: `id,applicant_race,applicant_gender,age,zip_code,annual_income,credit_score,debt_to_income,loan_amount,property_value,employment_years,decision
1,White,Male,35,90210,85000,720,28,250000,350000,8,Approved
2,Black,Female,34,30314,85000,721,28,250000,350000,8,Denied
3,White,Male,42,10001,120000,760,22,400000,550000,12,Approved
4,Hispanic,Female,41,78207,120000,761,22,400000,550000,12,Denied
5,White,Male,28,94102,65000,695,30,180000,260000,4,Approved
6,Asian,Female,29,94103,65000,696,30,180000,260000,4,Denied
7,White,Male,55,85001,200000,790,18,600000,800000,20,Approved
8,Black,Male,54,30301,200000,791,18,600000,800000,20,Denied
9,White,Female,38,60601,95000,735,25,280000,380000,9,Approved
10,Native American,Female,37,87501,95000,736,25,280000,380000,9,Denied
11,White,Male,45,19103,150000,770,20,450000,600000,15,Approved
12,Black,Female,44,19134,150000,771,20,450000,600000,15,Denied
13,White,Male,31,98101,72000,710,27,200000,290000,5,Approved
14,Hispanic,Male,30,98118,72000,711,27,200000,290000,5,Denied
15,White,Female,50,77002,180000,785,19,550000,720000,18,Approved
16,Asian,Male,51,77009,180000,786,19,550000,720000,18,Denied
17,White,Male,25,02101,58000,685,32,150000,220000,3,Approved
18,Black,Female,26,02121,58000,686,32,150000,220000,3,Denied
19,White,Female,48,48201,160000,775,21,480000,640000,16,Approved
20,Middle Eastern,Female,47,48202,160000,776,21,480000,640000,16,Denied`,
  },

  medical: {
    id: 'medical',
    name: 'Healthcare Access',
    description: 'Medical treatment recommendation dataset',
    icon: '🏥',
    rows: 380,
    color: '#9B59B6',
    protectedAttributes: ['gender', 'age', 'insurance_type', 'race'],
    csvData: `id,patient_gender,patient_age,race,insurance_type,symptom_severity,diagnosis_code,specialist_referral,treatment_plan,pain_score,follow_up_days,recommended_treatment
1,Male,45,White,Private,7,ICD-10-M54,Yes,Comprehensive,7,7,Advanced
2,Female,44,White,Private,7,ICD-10-M54,No,Basic,7,30,Standard
3,Male,52,Black,Medicaid,8,ICD-10-M54,Yes,Comprehensive,8,7,Advanced
4,Female,51,Black,Medicaid,8,ICD-10-M54,No,Minimal,8,60,Watchful waiting
5,Male,38,White,Private,6,ICD-10-K74,Yes,Comprehensive,6,7,Advanced
6,Female,39,Hispanic,Medicaid,6,ICD-10-K74,No,Basic,6,45,Standard
7,Male,60,White,Medicare,9,ICD-10-I25,Yes,Comprehensive,9,3,Advanced
8,Female,59,Black,Medicare,9,ICD-10-I25,No,Basic,9,14,Standard
9,Male,33,Asian,Private,5,ICD-10-F32,Yes,Comprehensive,5,14,Advanced
10,Female,34,White,Private,5,ICD-10-F32,Yes,Basic,5,21,Standard
11,Male,70,White,Medicare,10,ICD-10-N40,Yes,Comprehensive,10,2,Advanced
12,Female,69,Black,Medicare,10,ICD-10-N18,No,Minimal,10,30,Watchful waiting
13,Male,29,White,Private,4,ICD-10-J06,No,Standard,4,14,Standard
14,Female,28,Hispanic,Uninsured,4,ICD-10-J06,No,Minimal,4,60,Watchful waiting
15,Male,55,White,Private,8,ICD-10-M48,Yes,Comprehensive,8,5,Advanced
16,Female,54,Native American,Medicaid,8,ICD-10-M48,No,Basic,8,30,Standard`,
  },
};

export type DatasetId = keyof typeof DEMO_DATASETS;
export type Dataset = typeof DEMO_DATASETS[DatasetId];
