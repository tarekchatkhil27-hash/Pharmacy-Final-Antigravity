import React, { useState, useMemo } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export function StaffAttendance() {
  const { staff, attendance, setAttendance, rosters } = useGlobal();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activeStaff = useMemo(() => staff.filter(s => s.status === 'active'), [staff]);

  const getAttendanceForStaff = (staffId: string) => {
    return attendance.find(a => a.staffId === staffId && a.date === selectedDate);
  };

  const getAssignedShift = (staffId: string) => {
    const roster = rosters.find(r => r.staffId === staffId && r.date === selectedDate);
    return roster ? roster.shift : 'Unassigned';
  };

  const markAttendance = (staffId: string, status: 'present' | 'absent' | 'late' | 'half-day') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.staffId === staffId && a.date === selectedDate);
      if (existing) {
        return prev.map(a => a.id === existing.id ? { ...a, status } : a);
      } else {
        return [...prev, {
          id: `ATT-${Date.now()}`,
          staffId,
          date: selectedDate,
          status,
          checkIn: status === 'present' || status === 'late' ? new Date().toLocaleTimeString() : undefined
        }];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Daily Attendance')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Mark attendance based on today\'s roster.')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <CardTitle>{t('Attendance Sheet')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Employee')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Assigned Shift')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Status')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeStaff.map(employee => {
                  const record = getAttendanceForStaff(employee.id);
                  const assignedShift = getAssignedShift(employee.id);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50">{employee.name}</p>
                            <p className="text-xs text-slate-500">{employee.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${assignedShift === 'Off' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                          <Clock className="h-3 w-3" />
                          {t(assignedShift)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!record ? (
                          <span className="text-slate-400 italic text-xs">{t('Not marked')}</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            record.status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            record.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {record.status === 'present' && <CheckCircle className="h-3 w-3" />}
                            {record.status === 'absent' && <XCircle className="h-3 w-3" />}
                            {record.status === 'late' && <AlertCircle className="h-3 w-3" />}
                            {record.status === 'half-day' && <Clock className="h-3 w-3" />}
                            <span className="capitalize">{t(record.status)}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant={record?.status === 'present' ? 'default' : 'outline'}
                            className={record?.status === 'present' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                            onClick={() => markAttendance(employee.id, 'present')}
                            disabled={assignedShift === 'Off'}
                          >
                            {t('Present')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={record?.status === 'late' ? 'default' : 'outline'}
                            className={record?.status === 'late' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                            onClick={() => markAttendance(employee.id, 'late')}
                            disabled={assignedShift === 'Off'}
                          >
                            {t('Late')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={record?.status === 'absent' ? 'default' : 'outline'}
                            className={record?.status === 'absent' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                            onClick={() => markAttendance(employee.id, 'absent')}
                            disabled={assignedShift === 'Off'}
                          >
                            {t('Absent')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No active staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
