'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

export const useJobSelector = () => {
  const supabase = createClient();
  const [allJobs, setAllJobs] = useState([]);
  const [activeJob, setActiveJobState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
    const saved = localStorage.getItem('fd-active-job');
    if (saved) setActiveJobState(JSON.parse(saved));
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (jobs) {
        setAllJobs(jobs);
        if (!activeJob && jobs.length > 0) {
          setActiveJobState(jobs[0]);
          localStorage.setItem('fd-active-job', JSON.stringify(jobs[0]));
        }
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
    setLoading(false);
  };

  const setActiveJob = (job) => {
    setActiveJobState(job);
    localStorage.setItem('fd-active-job', JSON.stringify(job));
  };

  const createQuickJob = async (title) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newJob } = await supabase
        .from('jobs')
        .insert({ user_id: user.id, title, status: 'ACTIVE' })
        .select()
        .single();
      
      if (newJob) {
        setAllJobs([newJob, ...allJobs]);
        setActiveJob(newJob);
        return newJob;
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
    return null;
  };

  return {
    activeJob,
    setActiveJob,
    allJobs,
    loading,
    recentJobs: allJobs.slice(0, 7),
    createQuickJob
  };
};
