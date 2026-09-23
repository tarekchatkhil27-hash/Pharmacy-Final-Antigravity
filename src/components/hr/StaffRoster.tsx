import React, { useState, useMemo } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar, Clock, Save } from 'lucide-react';

export function StaffRoster() {
  const { staff, rosters, setRosters } = useGlobal();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activeStaff = useMemo(() => staff.filter(s => s.status === 'active'), [staff]);

  const getRosterForStaff = (staffId: string) => {
    return rosters.find(r => r.staffId === staffId && r.date === selectedDate);
  };

  const handleShiftChange = (staffId: string, shift: 'Morning' | 'Evening' | 'Night' | 'Flexible' | 'Off') => {
    setRosters(prev => {
      const existing = prev.find(r => r.staffId === staffId && r.date === selectedDate);
      if (existing) {
        return prev.map(r => r.id === existing.id ? { ...r, shift } : r);
      } else {
        return [...prev, {
          id: `RST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          staffId,
          date: selectedDate,
          shift
        }];
      }
    });
  };

  const applyDefaultShifts = () => {
    const newRosters = [...rosters];
    let changesMade = false;

    activeStaff.forEach(employee => {
      const existing = newRosters.find(r => r.staffId === employee.id && r.date === selectedDate);
      if (!existing) {
        newRosters.push({
          id: `RST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          staffId: employee.id,
          date: selectedDate,
          shift: employee.shift || 'Morning'
        });
        changesMade = true;
      }
    });

    if (changesMade) {
      setRosters(newRosters);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Duty Roster')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Assign shifts to staff members for specific dates.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={applyDefaultShifts} className="text-sm h-10">
            Apply Default Shifts
          </Button>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm h-10">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <CardTitle>{t('Shift Assignments for')} {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Employee')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Default Shift')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Assigned Shift')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeStaff.map(employee => {
                  const roster = getRosterForStaff(employee.id);
                  const currentShift = roster ? roster.shift : 'Unassigned';

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
                        <span className="text-slate-500 dark:text-slate-400">{t(employee.shift)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={currentShift}
                          onChange={(e) => handleShiftChange(employee.id, e.target.value as any)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        >
                          <option value="Unassigned" disabled>{t('Select Shift')}</option>
                          <option value="Morning">{t('Morning')}</option>
                          <option value="Evening">{t('Evening')}</option>
                          <option value="Night">{t('Night')}</option>
                          <option value="Flexible">{t('Flexible')}</option>
                          <option value="Off">{t('Off')}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      {t('No active staff members found.')}
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
