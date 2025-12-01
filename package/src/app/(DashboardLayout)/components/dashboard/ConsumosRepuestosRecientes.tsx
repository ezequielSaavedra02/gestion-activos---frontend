'use client';
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

interface ConsumoRepuesto {
  id: number;
  nombre_repuesto: string;
  cantidad_consumida: number;
  equipo_asociado: string;
  fecha_consumo: string;
}

const ConsumosRepuestosRecientes = () => {
  const [consumos, setConsumos] = useState<ConsumoRepuesto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Activando la llamada fetch al endpoint de Python
    fetch('http://127.0.0.1:5001/api/movimientos/repuestos-recientes')
      .then(res => {
        if (!res.ok) {
          throw new Error('La respuesta de la red no fue correcta');
        }
        return res.json();
      })
      .then(data => {
        setConsumos(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error al obtener consumos de repuestos:", error);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardCard title="Consumos de Repuestos Recientes">
      <Box sx={{ overflow: 'auto', width: { xs: '280px', sm: 'auto' } }}>
        <Table aria-label="consumos recientes" sx={{ whiteSpace: "nowrap", mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Repuesto</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Cantidad</Typography></TableCell>
              <TableCell><Typography variant="subtitle2" fontWeight={600}>Asociado a</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2" fontWeight={600}>Fecha</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center">Cargando...</TableCell></TableRow>
            ) : consumos.length > 0 ? (
              consumos.map((consumo) => (
                <TableRow key={consumo.id}>
                  <TableCell><Typography variant="subtitle2">{consumo.nombre_repuesto}</Typography></TableCell>
                  <TableCell><Chip label={consumo.cantidad_consumida} color="secondary" size="small" /></TableCell>
                  <TableCell><Typography variant="subtitle2">{consumo.equipo_asociado}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle2">{new Date(consumo.fecha_consumo).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center">No hay datos para mostrar.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </DashboardCard>
  );
};

export default ConsumosRepuestosRecientes;
