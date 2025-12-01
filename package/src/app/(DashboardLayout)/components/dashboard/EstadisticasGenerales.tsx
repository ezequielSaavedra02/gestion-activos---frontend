'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Typography, Box, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Filtro = 'equipos' | 'sectores' | 'repuestos';

const EstadisticasGenerales = () => {
  const [filtro, setFiltro] = useState<Filtro>('equipos');
  const [chartConfig, setChartConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    setChartConfig(null);
    setError(null);

    let endpoint = '';
    let dataMapper: (item: any) => { label: string, value: number };
    let seriesName = '';
    let color = theme.palette.primary.main;

    switch (filtro) {
      case 'equipos':
        endpoint = 'http://127.0.0.1:5001/api/stats/equipos-fallas';
        dataMapper = item => ({ label: `${item.marca || 'N/A'} (${item.numero_serie || 'N/A'})`, value: item.fallos || 0 });
        seriesName = 'Fallos';
        color = theme.palette.primary.main;
        break;
      case 'sectores':
        endpoint = 'http://127.0.0.1:5001/api/stats/ubicaciones-solicitudes';
        dataMapper = item => ({ label: item.ubicacion || 'N/A', value: item.solicitudes || 0 });
        seriesName = 'Solicitudes';
        color = theme.palette.secondary.main;
        break;
      case 'repuestos':
        endpoint = 'http://127.0.0.1:5001/api/stats/repuestos-usados';
        dataMapper = item => ({ label: item.repuesto || 'N/A', value: item.uso_total || 0 });
        seriesName = 'Consumo';
        color = theme.palette.warning.main;
        break;
    }

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error('La respuesta de la red no fue correcta');
        return res.json();
      })
      .then(apiData => {
        if (!apiData || apiData.length === 0) {
          setLoading(false);
          return;
        }
        const formattedData = apiData.map(dataMapper).sort((a, b) => a.value - b.value);
        
        const config = {
          options: {
            chart: { type: 'bar', fontFamily: "'Plus Jakarta Sans', sans-serif;", foreColor: '#adb0bb', toolbar: { show: false } },
            colors: [color],
            plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
            xaxis: { categories: formattedData.map(d => d.label) },
            yaxis: { labels: { show: true, style: { fontSize: '12px' } } },
            dataLabels: { enabled: true, formatter: (val: number) => val.toString(), style: { colors: ['#333'] } },
            legend: { show: false },
            grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
            tooltip: { theme: 'dark', x: { show: false } },
          },
          series: [{ name: seriesName, data: formattedData.map(d => d.value) }],
        };

        setChartConfig(config);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error al obtener estadísticas para ${filtro}:`, err);
        setError('No se pudieron cargar los datos.');
        setLoading(false);
      });

  }, [filtro, theme]);

  const handleFiltroChange = (event: SelectChangeEvent<Filtro>) => {
    setFiltro(event.target.value as Filtro);
  };

  const renderContent = () => {
    if (loading) return <Typography sx={{ p: 2, textAlign: 'center' }}>Cargando...</Typography>;
    if (error) return <Typography color="error" sx={{ p: 2, textAlign: 'center' }}>{error}</Typography>;
    if (!chartConfig) return <Typography sx={{ p: 2, textAlign: 'center' }}>No hay datos para mostrar.</Typography>;
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Chart key={filtro} options={chartConfig.options} series={chartConfig.series} type="bar" height={300} width={"100%"} />
      </Box>
    );
  };

  return (
    <DashboardCard 
      title="Estadísticas Generales"
      action={
        <Select
          value={filtro}
          onChange={handleFiltroChange}
          size="small"
        >
          <MenuItem value="equipos">Equipos con más fallos</MenuItem>
          <MenuItem value="sectores">Sectores con más solicitudes</MenuItem>
          <MenuItem value="repuestos">Repuestos más usados</MenuItem>
        </Select>
      }
    >
      {renderContent()}
    </DashboardCard>
  );
};

export default EstadisticasGenerales;
