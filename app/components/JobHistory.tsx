"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export function JobHistory() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    fetchJobs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.jobHistory}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{job.id}</p>
                  <p className="text-sm text-gray-500">
                    {t.source}: {job.source_language} {'->'} {t.target}: {job.target_language}
                  </p>
                </div>
                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                  {job.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t.noJobsFound}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
