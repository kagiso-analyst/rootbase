export type CropStatus = 'planned' | 'active' | 'harvested' | 'failed'

export type Crop = {
  id: string
  cropName: string
  variety: string
  fieldName: string
  season: string
  plantingDate: string
  expectedHarvestDate: string
  areaPlantedHa: number
  status: CropStatus
  notes: string
  createdAt: string
}

export type ActivityType = 
  | 'Spraying'
  | 'Fertilising'
  | 'Irrigation'
  | 'Scouting'
  | 'Weeding'
  | 'Pruning'
  | 'Other'

export type Activity = {
  id: string
  cropId: string
  type: ActivityType
  description: string
  date: string
  product?: string
  rate?: string
}