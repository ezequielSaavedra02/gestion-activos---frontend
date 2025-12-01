'use client'
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import EstadisticasGenerales from '@/app/(DashboardLayout)/components/dashboard/EstadisticasGenerales';
import MovimientosEquiposRecientes from '@/app/(DashboardLayout)/components/dashboard/MovimientosEquiposRecientes';
import ConsumosRepuestosRecientes from '@/app/(DashboardLayout)/components/dashboard/ConsumosRepuestosRecientes';

const Dashboard = () => {
  return (
    <PageContainer title="Dashboard de Estadísticas" description="Estadísticas de gestión de activos">
      <Box>
        <Grid container spacing={3}>
          {/* Gráfico de Estadísticas */}
          <Grid item xs={12}>
            <EstadisticasGenerales />
          </Grid>

          {/* Listados de Movimientos */}
          <Grid item xs={12} lg={6}>
            <MovimientosEquiposRecientes />
          </Grid>
          <Grid item xs={12} lg={6}>
            <ConsumosRepuestosRecientes />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}

export default Dashboard;
