"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Species } from "@/contracts/patients";
import { api } from "./api";

const meKey = ["me"] as const;

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: api.me, retry: false, staleTime: 60_000 });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email: string) => api.requestPasswordReset(email) });
}

export function useChangePassword() {
  return useMutation({ mutationFn: (password: string) => api.changePassword(password) });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => queryClient.clear(),
  });
}

export function usePatients(params: { q?: string; species?: Species; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => api.patients(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({ queryKey: ["patient", id], queryFn: () => api.patient(id as string), enabled: Boolean(id) });
}

export function useRecentSheets(params: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["sheets", "recent", params],
    queryFn: () => api.recentSheets(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatientSheets(patientId: string | undefined, params: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["sheets", "patient", patientId, params],
    queryFn: () => api.patientSheets(patientId as string, params),
    enabled: Boolean(patientId),
    placeholderData: keepPreviousData,
  });
}

export function useSheet(id: string | undefined) {
  return useQuery({
    queryKey: ["sheet", id],
    queryFn: () => api.sheet(id as string),
    enabled: Boolean(id),
    // The editor owns the working copy; refetching behind its back would be confusing.
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useClinic(enabled: boolean) {
  return useQuery({ queryKey: ["clinic"], queryFn: api.clinic, enabled });
}

export function useUpdateClinic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateClinic,
    onSuccess: (clinic) => {
      queryClient.setQueryData(["clinic"], clinic);
      void queryClient.invalidateQueries({ queryKey: meKey });
    },
  });
}

/** After a save, lists and patient data are stale. */
export function useInvalidateSheetData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["sheets"] });
    void queryClient.invalidateQueries({ queryKey: ["patients"] });
    void queryClient.invalidateQueries({ queryKey: ["patient"] });
  };
}
