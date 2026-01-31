"use client";

import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function useJobDetails(jobId) {
  const supabase = createClient();
  const [job, setJob] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [rig, setRig] = useState(null);
  const [estimateTotal, setEstimateTotal] = useState(0);
  const [contractStatus, setContractStatus] = useState("not_started");
  const [photoCount, setPhotoCount] = useState(0);
  const [toolsCount, setToolsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadJobDetails = async () => {
      if (!jobId) {
        setJob(null);
        setCustomer(null);
        setRig(null);
        setEstimateTotal(0);
        setContractStatus("not_started");
        setPhotoCount(0);
        setToolsCount(0);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const jobPromise = supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single();

        const estimatesPromise = supabase
          .from("estimates")
          .select("total_price")
          .eq("job_id", jobId);

        const contractsPromise = supabase
          .from("contracts")
          .select("signed_at")
          .eq("job_id", jobId);

        const photosCountPromise = supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("job_id", jobId);

        const toolsCountPromise = supabase
          .from("tools")
          .select("id", { count: "exact", head: true })
          .eq("job_id", jobId);

        const [
          jobResult,
          estimatesResult,
          contractsResult,
          photosCountResult,
          toolsCountResult,
        ] = await Promise.all([
          jobPromise,
          estimatesPromise,
          contractsPromise,
          photosCountPromise,
          toolsCountPromise,
        ]);

        if (cancelled) return;

        if (jobResult.error) throw jobResult.error;
        const jobData = jobResult.data || null;
        setJob(jobData);
        setCustomer(null);
        setRig(null);

        if (jobData?.customer_id) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("*")
            .eq("id", jobData.customer_id)
            .single();
          setCustomer(customerData || null);
        }

        if (jobData?.rig_id) {
          const { data: fleetData } = await supabase
            .from("fleet")
            .select("*")
            .eq("id", jobData.rig_id)
            .single();
          setRig(fleetData || null);
        }

        const estimates = estimatesResult.data || [];
        const summedTotal = estimates.reduce(
          (acc, row) => acc + (Number(row.total_price) || 0),
          0
        );
        setEstimateTotal(summedTotal);

        const contracts = contractsResult.data || [];
        if (contracts.length === 0) {
          setContractStatus("not_started");
        } else if (contracts.some((c) => Boolean(c.signed_at))) {
          setContractStatus("signed");
        } else {
          setContractStatus("pending");
        }

        setPhotoCount(photosCountResult.count || 0);
        setToolsCount(toolsCountResult.count || 0);
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJobDetails();

    return () => {
      cancelled = true;
    };
  }, [jobId, supabase]);

  return {
    job,
    customer,
    rig,
    estimateTotal,
    contractStatus,
    photoCount,
    toolsCount,
    loading,
    error,
  };
}
