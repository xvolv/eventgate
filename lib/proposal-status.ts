export const statusColors = {
  LEAD_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LEAD_APPROVED: "bg-green-100 text-green-800 border-green-300",
  LEAD_REJECTED: "bg-red-100 text-red-800 border-red-300",
  PENDING: "bg-blue-100 text-blue-800 border-blue-300",
  SU_APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  SU_REJECTED: "bg-red-100 text-red-800 border-red-300",
  DIRECTOR_APPROVED: "bg-purple-100 text-purple-800 border-purple-300",
  DIRECTOR_REJECTED: "bg-red-100 text-red-800 border-red-300",
  RESUBMISSION_REQUIRED: "bg-orange-100 text-orange-800 border-orange-300",
} as const;

export const statusLabels = {
  LEAD_REVIEW: "Under Lead Review",
  LEAD_APPROVED: "Lead Approved",
  LEAD_REJECTED: "Lead Rejected",
  PENDING: "Pending Student Union Review",
  SU_APPROVED: "Student Union Approved",
  SU_REJECTED: "Student Union Rejected",
  DIRECTOR_APPROVED: "Director Approved",
  DIRECTOR_REJECTED: "Director Rejected",
  RESUBMISSION_REQUIRED: "Resubmission Required",
} as const;
