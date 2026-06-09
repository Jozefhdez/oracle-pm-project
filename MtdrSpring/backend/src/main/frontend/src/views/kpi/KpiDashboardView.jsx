import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { ORANGE_ACCENT } from '../../styles/theme';
import { devName } from '../../constants/devNames';

const BAR_TASKS = '#31a09c';
const BAR_HOURS = '#d7790e';
const ALL_DEVELOPERS = 'all';

const DEV_COLORS = ['#5999B5', '#D7790F', '#699E61', '#9E7FCC', '#F0CC72'];

const STAT_BORDERS = {
  tasks: '#2196F3',
  hours: '#4CAF50',
  avgTasks: '#9C27B0',
  avgHours: ORANGE_ACCENT,
  medianTasks: '#E91E63',
  medianHours: '#795548',
};

function calcAverage(values) {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function calcMedian(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

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

function InlineMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Box component="strong" key={`${part}-${index}`} sx={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    return part;
  });
}

function MarkdownInsight({ text }) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Box sx={{ color: '#2B2B2B' }}>
      {lines.map((line, index) => {
        const isBullet = /^[-*]\s+/.test(line);

        if (isBullet) {
          return (
            <Box
              component="ul"
              key={`${line}-${index}`}
              sx={{ m: 0, pl: '18px', mb: index === lines.length - 1 ? 0 : 0.8 }}
            >
              <Typography component="li" sx={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
                <InlineMarkdown text={line.replace(/^[-*]\s+/, '')} />
              </Typography>
            </Box>
          );
        }

        return (
          <Typography
            key={`${line}-${index}`}
            sx={{ fontSize: '0.9rem', lineHeight: 1.6, mb: index === lines.length - 1 ? 0 : 1 }}
          >
            <InlineMarkdown text={line.replace(/^#{1,4}\s+/, '')} />
          </Typography>
        );
      })}
    </Box>
  );
}

function AiInsightDialog({ open, question, insight, loading, onClose, onQuestionChange, onAsk }) {
  const canAsk = question.trim().length > 0 && !loading;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '8px',
          bgcolor: '#fbf9f8',
          border: '1px solid #E8E8E8',
          boxShadow: '0 18px 48px rgba(31, 28, 25, 0.18)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AutoAwesomeIcon sx={{ color: ORANGE_ACCENT, fontSize: 22 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1A1A1A' }}>
            AI KPI Insight
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close AI insight">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Box
          sx={{
            minHeight: 142,
            border: '1px solid #E8E8E8',
            borderRadius: '8px',
            bgcolor: '#fff',
            p: '16px',
            mb: '14px',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#717171' }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: '0.875rem' }}>Reading KPI context...</Typography>
            </Box>
          ) : (
            <MarkdownInsight
              text={insight || 'Open this panel to generate an AI summary for the current filters.'}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <TextField
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            placeholder="Ask about workload, risks, or sprint performance"
            size="small"
            fullWidth
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                borderRadius: '8px',
                fontSize: '0.875rem',
                height: 48,
                boxSizing: 'border-box',
              },
              '& .MuiOutlinedInput-input': {
                height: '100%',
                boxSizing: 'border-box',
                px: '14px',
                py: 0,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={onAsk}
            disabled={!canAsk}
            aria-label="Ask AI"
            sx={{
              flex: '0 0 48px',
              minWidth: 48,
              width: 48,
              height: 48,
              p: 0,
              borderRadius: '8px',
              bgcolor: '#2B2B2B',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#1A1A1A', boxShadow: 'none' },
            }}
          >
            <SendIcon sx={{ fontSize: 20 }} />
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function StatBarChart({ data, dataKey, fill, tooltipFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 36 }}>
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
        <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} maxBarSize={44}>
          <LabelList dataKey={dataKey} position="top" style={{ fontSize: 11, fill: '#717171' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const truncate = (str, n) => (str.length > n ? `${str.slice(0, n)}…` : str);

function GroupedBarChart({ data, devNames, dataKeySuffix, tooltipFormatter }) {
  const displayData = data.map((d) => ({ ...d, sprint: truncate(d.sprint, 18) }));
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={displayData} margin={{ top: 20, right: 8, left: 0, bottom: 72 }}>
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
          >
            <LabelList
              dataKey={`${dev}__${dataKeySuffix}`}
              position="top"
              style={{ fontSize: 9, fill: '#717171' }}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function filterStatsByDeveloper(stats, developerFilter) {
  if (!developerFilter || developerFilter === ALL_DEVELOPERS) return stats;
  return stats.filter((d) => d.email === developerFilter);
}

function AllSprintsCharts({ allSprintsStats, currentUserEmail, developerFilter }) {
  const filteredAllSprintsStats = allSprintsStats.map(({ sprint, developerStats }) => ({
    sprint,
    developerStats: filterStatsByDeveloper(developerStats, developerFilter),
  }));

  const allStats = filteredAllSprintsStats.flatMap((s) => s.developerStats);
  const devNames = [...new Set(allStats.map((d) => devName(d.email)))];

  const totalTasks = allStats.reduce((s, d) => s + d.totalAssigned, 0);
  const totalHours = allStats.reduce((s, d) => s + Number(d.totalHoursWorked ?? 0), 0);

  const focusEmail =
    developerFilter && developerFilter !== ALL_DEVELOPERS ? developerFilter : currentUserEmail;
  const focusStats = focusEmail ? allStats.filter((d) => d.email === focusEmail) : [];
  const myTasks = focusStats.length ? focusStats.reduce((s, d) => s + d.tasksCompleted, 0) : null;
  const myHours = focusStats.length
    ? focusStats.reduce((s, d) => s + Number(d.totalHoursWorked ?? 0), 0)
    : null;

  const devAggMap = new Map();
  allStats.forEach((d) => {
    const prev = devAggMap.get(d.email) ?? { tasks: 0, hours: 0 };
    devAggMap.set(d.email, {
      tasks: prev.tasks + d.tasksCompleted,
      hours: prev.hours + Number(d.totalHoursWorked ?? 0),
    });
  });
  const devAgg = [...devAggMap.values()];
  const allSprintsAvgTasks = calcAverage(devAgg.map((d) => d.tasks));
  const allSprintsAvgHours = calcAverage(devAgg.map((d) => d.hours));
  const allSprintsMedianTasks = calcMedian(devAgg.map((d) => d.tasks));
  const allSprintsMedianHours = calcMedian(devAgg.map((d) => d.hours));

  const tasksData = filteredAllSprintsStats.map(({ sprint, developerStats }) => {
    const point = { sprint: sprint.name };
    developerStats.forEach((d) => {
      point[`${devName(d.email)}__tasks`] = d.tasksCompleted;
    });
    return point;
  });

  const hoursData = filteredAllSprintsStats.map(({ sprint, developerStats }) => {
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
        <ChartCard
          title={
            developerFilter && developerFilter !== ALL_DEVELOPERS
              ? 'Selected Developer (All Sprints)'
              : 'Your Stats (All Sprints)'
          }
        >
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

      {devAgg.length > 1 && (
        <Grid item xs={12}>
          <ChartCard title="Team Averages">
            <Grid container spacing="12px">
              <Grid item xs={6} md={3}>
                <StatCard
                  label="Avg Tasks Done / Dev"
                  value={allSprintsAvgTasks?.toFixed(1) ?? '—'}
                  description="Mean completed tasks per developer"
                  borderColor={STAT_BORDERS.avgTasks}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard
                  label="Avg Hours / Dev"
                  value={allSprintsAvgHours?.toFixed(1) ?? '—'}
                  description="Mean hours worked per developer"
                  borderColor={STAT_BORDERS.avgHours}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard
                  label="Median Tasks Done / Dev"
                  value={allSprintsMedianTasks?.toFixed(1) ?? '—'}
                  description="Median completed tasks per developer"
                  borderColor={STAT_BORDERS.medianTasks}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard
                  label="Median Hours / Dev"
                  value={allSprintsMedianHours?.toFixed(1) ?? '—'}
                  description="Median hours worked per developer"
                  borderColor={STAT_BORDERS.medianHours}
                />
              </Grid>
            </Grid>
          </ChartCard>
        </Grid>
      )}

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
  developerStats,
  allSprintsStats,
  currentUserEmail,
  developerFilter = ALL_DEVELOPERS,
  aiOpen = false,
  aiQuestion = '',
  aiInsight = '',
  aiLoading = false,
  loadingStats,
  onSprintChange,
  onDeveloperFilterChange,
  onOpenAi,
  onCloseAi,
  onAiQuestionChange,
  onAskAi,
}) {
  const isAllSprints = sprintId === 'all';
  const visibleDeveloperStats = filterStatsByDeveloper(developerStats, developerFilter);

  const allDeveloperStats = [
    ...developerStats,
    ...allSprintsStats.flatMap((s) => s.developerStats ?? []),
  ];
  const developerOptions = Array.from(
    new Map(
      allDeveloperStats
        .filter((d) => d?.email)
        .map((d) => [d.email, { email: d.email, name: devName(d.email) }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const totalTasks = visibleDeveloperStats.reduce((s, d) => s + d.totalAssigned, 0);
  const totalHours = visibleDeveloperStats.reduce(
    (s, d) => Number(s) + Number(d.totalHoursWorked ?? 0),
    0
  );

  const focusEmail =
    developerFilter && developerFilter !== ALL_DEVELOPERS ? developerFilter : currentUserEmail;
  const myStat = focusEmail
    ? (visibleDeveloperStats.find((d) => d.email === focusEmail) ??
      developerStats.find((d) => d.email === focusEmail) ??
      null)
    : null;
  const myTasks = myStat ? String(myStat.tasksCompleted) : '—';
  const myHours = myStat ? Number(myStat.totalHoursWorked ?? 0).toFixed(1) : '—';
  const personalStatsTitle =
    developerFilter && developerFilter !== ALL_DEVELOPERS ? 'Selected Developer' : 'Your Stats';

  const devTaskValues = developerStats.map((d) => d.tasksCompleted);
  const devHourValues = developerStats.map((d) => Number(d.totalHoursWorked ?? 0));
  const avgTasksPerDev = calcAverage(devTaskValues);
  const avgHoursPerDev = calcAverage(devHourValues);
  const medianTasksPerDev = calcMedian(devTaskValues);
  const medianHoursPerDev = calcMedian(devHourValues);

  const chartData = visibleDeveloperStats.map((d) => ({
    name: devName(d.email),
    tasksCompleted: d.tasksCompleted,
    totalHours: Number(Number(d.totalHoursWorked ?? 0).toFixed(1)),
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

        <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

          <FormControl size="small" sx={{ minWidth: 210 }}>
            <Select
              value={developerFilter}
              onChange={(e) => onDeveloperFilterChange(e.target.value)}
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
              <MenuItem value={ALL_DEVELOPERS} sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                All Developers
              </MenuItem>
              {developerOptions.map((dev) => (
                <MenuItem
                  key={dev.email}
                  value={dev.email}
                  sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2B2B2B' }}
                >
                  {dev.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={onOpenAi}
            disabled={!sprintId || loadingStats}
            aria-label="Open AI KPI insight"
            sx={{
              minWidth: 42,
              height: 40,
              px: '10px',
              borderRadius: '8px',
              borderColor: '#E8E8E8',
              color: '#2B2B2B',
              bgcolor: '#fbf9f8',
              '&:hover': { borderColor: ORANGE_ACCENT, bgcolor: '#fff7f1' },
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 19 }} />
          </Button>
        </Box>
      </Box>

      <AiInsightDialog
        open={aiOpen}
        question={aiQuestion}
        insight={aiInsight}
        loading={aiLoading}
        onClose={onCloseAi}
        onQuestionChange={onAiQuestionChange}
        onAsk={onAskAi}
      />

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
          developerFilter={developerFilter}
        />
      )}

      {/* Single sprint view */}
      {sprintId && !isAllSprints && !loadingStats && (
        <>
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
              <ChartCard title={personalStatsTitle}>
                <Grid container spacing="12px">
                  <Grid item xs={6}>
                    <StatCard
                      label="Tasks Completed"
                      value={myTasks}
                      description={
                        developerFilter !== ALL_DEVELOPERS
                          ? 'Tasks completed by selected developer'
                          : 'Tasks you completed this sprint'
                      }
                      borderColor={STAT_BORDERS.avgTasks}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      label="Hours Logged"
                      value={myHours}
                      description={
                        developerFilter !== ALL_DEVELOPERS
                          ? 'Hours logged by selected developer'
                          : 'Hours you logged this sprint'
                      }
                      borderColor={STAT_BORDERS.avgHours}
                    />
                  </Grid>
                </Grid>
              </ChartCard>
            </Grid>
          </Grid>

          {/* Team Averages */}
          {developerStats.length > 1 && (
            <Grid container spacing="28px" sx={{ mb: '28px' }}>
              <Grid item xs={12}>
                <ChartCard title="Team Averages">
                  <Grid container spacing="12px">
                    <Grid item xs={6} md={3}>
                      <StatCard
                        label="Avg Tasks Done / Dev"
                        value={avgTasksPerDev?.toFixed(1) ?? '—'}
                        description="Mean completed tasks per developer"
                        borderColor={STAT_BORDERS.avgTasks}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard
                        label="Avg Hours / Dev"
                        value={avgHoursPerDev?.toFixed(1) ?? '—'}
                        description="Mean hours worked per developer"
                        borderColor={STAT_BORDERS.avgHours}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard
                        label="Median Tasks Done / Dev"
                        value={medianTasksPerDev?.toFixed(1) ?? '—'}
                        description="Median completed tasks per developer"
                        borderColor={STAT_BORDERS.medianTasks}
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard
                        label="Median Hours / Dev"
                        value={medianHoursPerDev?.toFixed(1) ?? '—'}
                        description="Median hours worked per developer"
                        borderColor={STAT_BORDERS.medianHours}
                      />
                    </Grid>
                  </Grid>
                </ChartCard>
              </Grid>
            </Grid>
          )}

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
              </Grid>
            </>
          )}
        </>
      )}
    </Box>
  );
}
