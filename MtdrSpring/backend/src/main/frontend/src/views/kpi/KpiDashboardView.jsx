import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ORANGE_ACCENT } from '../../styles/theme';
import { devName } from '../../constants/devNames';

const BAR_TASKS = '#31a09c';
const BAR_HOURS = '#d7790e';
const BAR_COMPLETION = '#5999B5';
const LINE_CYCLE = '#d7790e';
const LINE_THROUGHPUT = '#31a09c';

const DEV_COLORS = ['#5999B5', '#D7790F', '#699E61', '#9E7FCC', '#F0CC72'];

const STAT_BORDERS = {
  tasks: '#2196F3',
  hours: '#4CAF50',
  avgTasks: '#9C27B0',
  avgHours: ORANGE_ACCENT,
  scopeCreep: '#E91E63',
  rework: '#FF9800',
  improvement: null,
};

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #E8E8E8',
  fontSize: '0.8rem',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

function SectionTitle({ children }) {
  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#2B2B2B', lineHeight: 1.3 }}
      >
        {children}
      </Typography>
      <Box sx={{ width: 32, height: 3, bgcolor: ORANGE_ACCENT, mt: '5px', borderRadius: '2px' }} />
    </Box>
  );
}

function StatCard({ label, value, description, borderColor }) {
  return (
    <Card
      sx={{
        border: '1px solid #E8E8E8',
        borderRadius: '8px',
        boxShadow: 'none',
        bgcolor: '#fbf9f8',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ height: '3px', bgcolor: borderColor, borderRadius: '10px', mb: '14px' }} />
        <Typography sx={{ fontSize: '0.9rem', color: '#1A1A1A', mb: '10px' }}>{label}</Typography>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            lineHeight: 1,
            color: '#1A1A1A',
            mb: '10px',
          }}
        >
          {value ?? '—'}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#717171' }}>{description}</Typography>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card
      sx={{
        border: '1px solid #E8E8E8',
        borderRadius: '8px',
        boxShadow: 'none',
        bgcolor: '#fbf9f8',
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ mb: '20px' }}>
          <SectionTitle>{title}</SectionTitle>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function StatBarChart({ data, dataKey, fill, tooltipFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 36 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#717171' }}
          angle={-25}
          textAnchor="end"
          interval={0}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#717171' }}
          allowDecimals={false}
          width={28}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        />
        <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const truncate = (str, n) => (str.length > n ? `${str.slice(0, n)}…` : str);

function GroupedBarChart({ data, devNames, dataKeySuffix, tooltipFormatter }) {
  const displayData = data.map((d) => ({ ...d, sprint: truncate(d.sprint, 18) }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={displayData} margin={{ top: 4, right: 8, left: 0, bottom: 72 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
        <XAxis
          dataKey="sprint"
          tick={{ fontSize: 10, fill: '#717171' }}
          angle={-40}
          textAnchor="end"
          interval={0}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#717171' }}
          allowDecimals={false}
          width={32}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }} />
        {devNames.map((dev, i) => (
          <Bar
            key={dev}
            dataKey={`${dev}__${dataKeySuffix}`}
            name={dev}
            fill={DEV_COLORS[i % DEV_COLORS.length]}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SprintQualityKPIs({ kpi }) {
  const reworkRate =
    kpi?.tasksCompleted > 0 ? ((kpi.tasksReworked / kpi.tasksCompleted) * 100).toFixed(1) : null;

  const changePct = kpi?.cycleTimeChangePct != null ? Number(kpi.cycleTimeChangePct) : null;
  const changeIsImprovement = changePct != null && changePct < 0;
  const changeBorderColor =
    changePct == null ? '#9E9E9E' : changeIsImprovement ? '#4CAF50' : '#F44336';
  const changeLabel = changePct == null ? '—' : `${changePct > 0 ? '+' : ''}${changePct}%`;

  return (
    <Box sx={{ mb: '28px' }}>
      <Box sx={{ mb: '16px' }}>
        <SectionTitle>Sprint Quality KPIs</SectionTitle>
      </Box>
      <Grid container spacing="16px">
        <Grid item xs={6} sm={4} md>
          <StatCard
            label="Scope Creep"
            value={kpi?.scopeCreepRatePct != null ? `${kpi.scopeCreepRatePct}%` : null}
            description="Tasks added after sprint start"
            borderColor={STAT_BORDERS.scopeCreep}
          />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard
            label="Rework Rate"
            value={reworkRate != null ? `${reworkRate}%` : null}
            description={
              kpi?.tasksReworked != null
                ? `${kpi.tasksReworked} of ${kpi.tasksCompleted} tasks reworked`
                : 'Tasks moved back from done'
            }
            borderColor={STAT_BORDERS.rework}
          />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard
            label="Cycle Time vs Prev"
            value={changeLabel}
            description={
              changeIsImprovement ? 'Improvement vs previous sprint' : 'Change vs previous sprint'
            }
            borderColor={changeBorderColor}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

function AgingWipTable({ agingWip }) {
  if (agingWip.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No in-progress tasks.</Typography>
    );
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}>
            Task
          </TableCell>
          <TableCell sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}>
            Assignee
          </TableCell>
          <TableCell
            align="right"
            sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}
          >
            Days
          </TableCell>
          <TableCell
            align="center"
            sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}
          >
            Status
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {agingWip.map((item) => (
          <TableRow key={item.taskId} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ fontSize: '0.82rem', color: '#1A1A1A', maxWidth: 200 }}>
              {item.title}
            </TableCell>
            <TableCell sx={{ fontSize: '0.82rem', color: '#717171' }}>
              {devName(item.assigneeEmail)}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#1A1A1A' }}>
              {item.daysInProgress}
            </TableCell>
            <TableCell align="center">
              <Chip
                label={item.wipHealth}
                size="small"
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  bgcolor: item.wipHealth === 'STALE' ? '#FFEBEE' : '#E8F5E9',
                  color: item.wipHealth === 'STALE' ? '#C62828' : '#2E7D32',
                  border: 'none',
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BlockedTasksTable({ blockedTasks }) {
  if (blockedTasks.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>No blocked tasks.</Typography>
    );
  }

  const priorityColor = { HIGH: '#F44336', MEDIUM: '#FF9800', LOW: '#9E9E9E' };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}>
            Task
          </TableCell>
          <TableCell sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}>
            Priority
          </TableCell>
          <TableCell sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}>
            Assignee
          </TableCell>
          <TableCell
            align="right"
            sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}
          >
            Days Blocked
          </TableCell>
          <TableCell
            align="right"
            sx={{ fontSize: '0.8rem', color: '#717171', fontWeight: 600, pb: '6px' }}
          >
            Reworks
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {blockedTasks.map((item) => (
          <TableRow key={item.taskId} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ fontSize: '0.82rem', color: '#1A1A1A', maxWidth: 180 }}>
              {item.title}
            </TableCell>
            <TableCell>
              <Chip
                label={item.priority}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: `${priorityColor[item.priority] ?? '#9E9E9E'}22`,
                  color: priorityColor[item.priority] ?? '#9E9E9E',
                  border: 'none',
                }}
              />
            </TableCell>
            <TableCell sx={{ fontSize: '0.82rem', color: '#717171' }}>
              {devName(item.assigneeEmail)}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#1A1A1A' }}>
              {item.daysBlocked}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#717171' }}>
              {item.reworkCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TrendsSection({ cycleTimeTrend, loadingTrend }) {
  if (loadingTrend) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '40px' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (!cycleTimeTrend.length) return null;

  const trendData = cycleTimeTrend.map((p) => ({
    sprint: truncate(p.sprintName, 16),
    cycleTime: p.avgCycleTimeDays != null ? Number(p.avgCycleTimeDays) : null,
    throughput: p.tasksPerDay != null ? Number(p.tasksPerDay) : null,
  }));

  return (
    <Grid container spacing="28px" sx={{ mb: '28px' }}>
      <Grid item xs={12} md={6}>
        <ChartCard title="Cycle Time Trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 10, fill: '#717171' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#717171' }}
                width={32}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) =>
                  v != null ? [`${v} days`, 'Avg Cycle Time'] : ['—', 'Avg Cycle Time']
                }
                contentStyle={TOOLTIP_STYLE}
              />
              <Line
                type="monotone"
                dataKey="cycleTime"
                stroke={LINE_CYCLE}
                strokeWidth={2}
                dot={{ r: 4, fill: LINE_CYCLE }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ChartCard title="Sprint Throughput">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 10, fill: '#717171' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#717171' }}
                width={32}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) =>
                  v != null ? [`${v} tasks/day`, 'Throughput'] : ['—', 'Throughput']
                }
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar
                dataKey="throughput"
                fill={LINE_THROUGHPUT}
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Grid>
    </Grid>
  );
}

function AllSprintsCharts({ allSprintsStats, currentUserEmail, cycleTimeTrend, loadingTrend }) {
  const allStats = allSprintsStats.flatMap((s) => s.developerStats);
  const devNames = [...new Set(allStats.map((d) => devName(d.email)))];

  const totalTasks = allStats.reduce((s, d) => s + d.totalAssigned, 0);
  const totalHours = allStats.reduce((s, d) => s + Number(d.totalHoursWorked ?? 0), 0);

  const myStats = currentUserEmail ? allStats.filter((d) => d.email === currentUserEmail) : [];
  const myTasks = myStats.length ? myStats.reduce((s, d) => s + d.tasksCompleted, 0) : null;
  const myHours = myStats.length
    ? myStats.reduce((s, d) => s + Number(d.totalHoursWorked ?? 0), 0)
    : null;

  const tasksData = allSprintsStats.map(({ sprint, developerStats }) => {
    const point = { sprint: sprint.name };
    developerStats.forEach((d) => {
      point[`${devName(d.email)}__tasks`] = d.tasksCompleted;
    });
    return point;
  });

  const hoursData = allSprintsStats.map(({ sprint, developerStats }) => {
    const point = { sprint: sprint.name };
    developerStats.forEach((d) => {
      point[`${devName(d.email)}__hours`] = Number(Number(d.totalHoursWorked ?? 0).toFixed(1));
    });
    return point;
  });

  if (devNames.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
        No developer data found.
      </Typography>
    );
  }

  return (
    <Grid container spacing="28px">
      <Grid item xs={12} md={6} data-testid="sprint-totals-card">
        <ChartCard title="All Sprints Totals">
          <Grid container spacing="12px">
            <Grid item xs={6}>
              <StatCard
                label="Total Tasks"
                value={totalTasks}
                description="All tasks across all sprints"
                borderColor={STAT_BORDERS.tasks}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="Total Real Hours"
                value={totalHours.toFixed(1)}
                description="Hours logged across all sprints"
                borderColor={STAT_BORDERS.hours}
              />
            </Grid>
          </Grid>
        </ChartCard>
      </Grid>
      <Grid item xs={12} md={6} data-testid="your-stats-card">
        <ChartCard title="Your Stats (All Sprints)">
          <Grid container spacing="12px">
            <Grid item xs={6}>
              <StatCard
                label="Tasks Completed"
                value={myTasks !== null ? String(myTasks) : '—'}
                description="Your tasks across all sprints"
                borderColor={STAT_BORDERS.avgTasks}
              />
            </Grid>
            <Grid item xs={6}>
              <StatCard
                label="Hours Logged"
                value={myHours !== null ? myHours.toFixed(1) : '—'}
                description="Your hours across all sprints"
                borderColor={STAT_BORDERS.avgHours}
              />
            </Grid>
          </Grid>
        </ChartCard>
      </Grid>

      <Grid item xs={12}>
        <TrendsSection cycleTimeTrend={cycleTimeTrend} loadingTrend={loadingTrend} />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartCard title="Tasks Completed by Developer per Sprint">
          <GroupedBarChart
            data={tasksData}
            devNames={devNames}
            dataKeySuffix="tasks"
            tooltipFormatter={(v, name) => [v, name]}
          />
        </ChartCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <ChartCard title="Real Hours by Developer per Sprint">
          <GroupedBarChart
            data={hoursData}
            devNames={devNames}
            dataKeySuffix="hours"
            tooltipFormatter={(v, name) => [`${v}h`, name]}
          />
        </ChartCard>
      </Grid>
    </Grid>
  );
}

export default function KpiDashboardView({
  projectName,
  sprints,
  sprintId,
  kpi,
  developerStats,
  agingWip,
  blockedTasks,
  botAdoption,
  cycleTimeTrend,
  allSprintsStats,
  currentUserEmail,
  loadingStats,
  loadingTrend,
  onSprintChange,
}) {
  const isAllSprints = sprintId === 'all';

  const totalTasks = developerStats.reduce((s, d) => s + d.totalAssigned, 0);
  const totalHours = developerStats.reduce((s, d) => s + Number(d.totalHoursWorked ?? 0), 0);

  const myStat = currentUserEmail
    ? (developerStats.find((d) => d.email === currentUserEmail) ?? null)
    : null;
  const myTasks = myStat ? String(myStat.tasksCompleted) : '—';
  const myHours = myStat ? Number(myStat.totalHoursWorked ?? 0).toFixed(1) : '—';

  const chartData = developerStats.map((d) => ({
    name: devName(d.email),
    tasksCompleted: d.tasksCompleted,
    totalHours: Number(Number(d.totalHoursWorked ?? 0).toFixed(1)),
    completionRate:
      d.totalAssigned > 0 ? Number(((d.tasksCompleted / d.totalAssigned) * 100).toFixed(1)) : 0,
  }));

  const botAdoptionData = botAdoption.map((d) => ({
    name: devName(d.email),
    web: d.webUpdates,
    bot: d.botUpdates,
  }));

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: '28px',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A', mb: '2px' }}>
            KPI Dashboard
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
            {projectName ?? 'Performance metrics per developer'}
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={sprintId}
            onChange={(e) => onSprintChange(e.target.value)}
            displayEmpty
            sx={{
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#2B2B2B',
              bgcolor: '#fbf9f8',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E8E8E8' },
              '& .MuiSelect-icon': { color: '#2B2B2B' },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: '0.85rem', color: '#717171' }}>
              Select sprint…
            </MenuItem>
            <MenuItem value="all" sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2B2B2B' }}>
              All Sprints
            </MenuItem>
            {sprints.map((s) => (
              <MenuItem
                key={s.id}
                value={s.id}
                sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2B2B2B' }}
              >
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!sprintId && (
        <Typography sx={{ fontSize: '0.875rem', color: '#717171' }}>
          Select a sprint to view KPIs.
        </Typography>
      )}

      {sprintId && loadingStats && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: '60px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* All Sprints view */}
      {isAllSprints && !loadingStats && (
        <AllSprintsCharts
          allSprintsStats={allSprintsStats}
          currentUserEmail={currentUserEmail}
          cycleTimeTrend={cycleTimeTrend}
          loadingTrend={loadingTrend}
        />
      )}

      {/* Single sprint view */}
      {sprintId && !isAllSprints && !loadingStats && (
        <>
          {/* Sprint Quality KPIs */}
          <SprintQualityKPIs kpi={kpi} />

          {/* Sprint Totals + Your Stats */}
          <Grid container spacing="28px" sx={{ mb: '28px' }}>
            <Grid item xs={12} md={6} data-testid="sprint-totals-card">
              <ChartCard title="Sprint Totals">
                <Grid container spacing="12px">
                  <Grid item xs={6}>
                    <StatCard
                      label="Total Tasks"
                      value={totalTasks}
                      description="All tasks assigned this sprint"
                      borderColor={STAT_BORDERS.tasks}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      label="Total Real Hours"
                      value={totalHours.toFixed(1)}
                      description="Sum of hours logged by all developers"
                      borderColor={STAT_BORDERS.hours}
                    />
                  </Grid>
                </Grid>
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6} data-testid="your-stats-card">
              <ChartCard title="Your Stats">
                <Grid container spacing="12px">
                  <Grid item xs={6}>
                    <StatCard
                      label="Tasks Completed"
                      value={myTasks}
                      description="Tasks you completed this sprint"
                      borderColor={STAT_BORDERS.avgTasks}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      label="Hours Logged"
                      value={myHours}
                      description="Hours you logged this sprint"
                      borderColor={STAT_BORDERS.avgHours}
                    />
                  </Grid>
                </Grid>
              </ChartCard>
            </Grid>
          </Grid>

          {/* Developer Performance */}
          {developerStats.length > 0 && (
            <>
              <Box sx={{ mb: '16px' }}>
                <SectionTitle>Developer Performance</SectionTitle>
              </Box>
              <Grid container spacing="28px" sx={{ mb: '28px' }}>
                <Grid item xs={12} md={6}>
                  <ChartCard title="Completed Tasks by Developer">
                    <StatBarChart
                      data={chartData}
                      dataKey="tasksCompleted"
                      fill={BAR_TASKS}
                      tooltipFormatter={(v) => [v, 'Completed Tasks']}
                    />
                  </ChartCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <ChartCard title="Real Hours by Developer">
                    <StatBarChart
                      data={chartData}
                      dataKey="totalHours"
                      fill={BAR_HOURS}
                      tooltipFormatter={(v) => [`${v}h`, 'Hours Worked']}
                    />
                  </ChartCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <ChartCard title="Completion Rate by Developer">
                    <StatBarChart
                      data={chartData}
                      dataKey="completionRate"
                      fill={BAR_COMPLETION}
                      tooltipFormatter={(v) => [`${v}%`, 'Completion Rate']}
                    />
                  </ChartCard>
                </Grid>
                {botAdoptionData.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <ChartCard title="Bot vs Web Updates by Developer">
                      <ResponsiveContainer width="100%" height={230}>
                        <BarChart
                          data={botAdoptionData}
                          margin={{ top: 4, right: 8, left: 0, bottom: 36 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#717171' }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#717171' }}
                            allowDecimals={false}
                            width={28}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                          />
                          <Legend
                            verticalAlign="top"
                            wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                          />
                          <Bar
                            dataKey="web"
                            name="Web"
                            stackId="a"
                            fill={BAR_TASKS}
                            radius={[0, 0, 0, 0]}
                            maxBarSize={44}
                          />
                          <Bar
                            dataKey="bot"
                            name="Telegram Bot"
                            stackId="a"
                            fill={BAR_HOURS}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={44}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </Grid>
                )}
              </Grid>
            </>
          )}

          {/* Live Sprint Health */}
          <Box sx={{ mb: '16px' }}>
            <SectionTitle>Live Sprint Health</SectionTitle>
          </Box>
          <Grid container spacing="28px">
            <Grid item xs={12} md={6}>
              <ChartCard title="Aging Work in Progress">
                <AgingWipTable agingWip={agingWip ?? []} />
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartCard title="Blocked Tasks">
                <BlockedTasksTable blockedTasks={blockedTasks ?? []} />
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
