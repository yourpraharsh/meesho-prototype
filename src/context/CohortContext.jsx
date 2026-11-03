import { createContext, useCallback, useContext, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  COHORT_PARAM,
  COHORT_TAG_PARAM,
  getCohortById,
  isMixedCohort,
  isValidCohortId,
  isValidCohortTag,
  resolveCohortId,
} from '../constants/cohortNavigation'
import { getCohortFlavourOptions } from '../utils/cohortFlavour'

const CohortContext = createContext(null)

export function CohortProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const cohortId = (() => {
    const raw = searchParams.get(COHORT_PARAM)
    return resolveCohortId(raw)
  })()

  const isMixedFeed = isMixedCohort(cohortId)
  const cohort = getCohortById(cohortId)

  const tagId = (() => {
    const raw = searchParams.get(COHORT_TAG_PARAM)
    return raw && isValidCohortTag(raw, cohort) ? raw : null
  })()

  const setCohortId = useCallback(
    (nextId) => {
      const next = new URLSearchParams(searchParams)
      if (nextId && isValidCohortId(nextId)) next.set(COHORT_PARAM, nextId)
      else {
        next.delete(COHORT_PARAM)
        next.delete(COHORT_TAG_PARAM)
      }
      const nextCohort = getCohortById(next.get(COHORT_PARAM))
      const currentTag = next.get(COHORT_TAG_PARAM)
      if (!isValidCohortTag(currentTag, nextCohort)) next.delete(COHORT_TAG_PARAM)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setTagId = useCallback(
    (nextTag) => {
      const next = new URLSearchParams(searchParams)
      if (nextTag && isValidCohortTag(nextTag, cohort)) next.set(COHORT_TAG_PARAM, nextTag)
      else next.delete(COHORT_TAG_PARAM)
      setSearchParams(next, { replace: true })
    },
    [cohort, searchParams, setSearchParams],
  )

  const flavourOptions = useMemo(
    () => getCohortFlavourOptions(cohortId, tagId),
    [cohortId, tagId],
  )

  const value = useMemo(
    () => ({
      cohortId,
      cohort,
      isMixedFeed,
      tagId,
      setCohortId,
      setTagId,
      flavourOptions,
    }),
    [cohortId, cohort, isMixedFeed, tagId, setCohortId, setTagId, flavourOptions],
  )

  return <CohortContext.Provider value={value}>{children}</CohortContext.Provider>
}

export function useCohort() {
  const ctx = useContext(CohortContext)
  if (!ctx) {
    throw new Error('useCohort must be used within CohortProvider')
  }
  return ctx
}
