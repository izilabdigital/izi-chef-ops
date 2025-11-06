import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Ícone customizado para entregador
const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Ícone para destino
const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DeliveryMap = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryLocations, setDeliveryLocations] = useState<{ [key: string]: [number, number] }>({});
  
  // Centro padrão (você pode ajustar para sua cidade)
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // São Paulo

  useEffect(() => {
    fetchActiveDeliveries();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('delivery-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `status=eq.em rota de entrega`,
        },
        () => {
          fetchActiveDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'em rota de entrega')
        .order('inicio_rota', { ascending: true });

      if (error) throw error;
      setOrders(data || []);

      // Simular localização do entregador (em produção, use geolocalização real)
      const locations: { [key: string]: [number, number] } = {};
      data?.forEach((order) => {
        if (order.latitude_entregador && order.longitude_entregador) {
          locations[order.id] = [order.latitude_entregador, order.longitude_entregador];
        }
      });
      setDeliveryLocations(locations);
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
    }
  };

  // Função para estimar coordenadas aproximadas baseadas no CEP (simplificado)
  const getApproximateLocation = (order: Order): [number, number] => {
    // Em produção, use uma API de geocodificação real
    // Esta é apenas uma simulação
    const hash = order.cep.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lat = defaultCenter[0] + (hash % 100) / 1000 - 0.05;
    const lng = defaultCenter[1] + ((hash * 2) % 100) / 1000 - 0.05;
    return [lat, lng];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Entregas em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {orders.map((order) => {
              const deliveryLocation = deliveryLocations[order.id];
              const destinationLocation = getApproximateLocation(order);

              return (
                <div key={order.id}>
                  {/* Marcador do entregador */}
                  {deliveryLocation && (
                    <Marker position={deliveryLocation} icon={deliveryIcon}>
                      <Popup>
                        <div className="text-sm">
                          <strong>Entregador</strong>
                          <br />
                          Pedido #{order.numero_pedido}
                          <br />
                          {order.tempo_estimado_minutos && (
                            <>Tempo estimado: {order.tempo_estimado_minutos} min</>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Marcador do destino */}
                  <Marker position={destinationLocation} icon={destinationIcon}>
                    <Popup>
                      <div className="text-sm">
                        <strong>Destino</strong>
                        <br />
                        {order.nome}
                        <br />
                        {order.rua}, {order.numero}
                        <br />
                        {order.bairro} - {order.cep}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Linha de rota */}
                  {deliveryLocation && (
                    <Polyline
                      positions={[deliveryLocation, destinationLocation]}
                      color="blue"
                      weight={3}
                      opacity={0.7}
                      dashArray="10, 10"
                    />
                  )}
                </div>
              );
            })}
          </MapContainer>
        </div>
        
        {orders.length === 0 && (
          <div className="text-center text-muted-foreground mt-4">
            Nenhuma entrega em andamento no momento
          </div>
        )}
        
        {orders.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Entregas em Andamento ({orders.length})</h4>
            {orders.map((order) => (
              <div key={order.id} className="text-sm flex justify-between items-center p-2 bg-muted rounded">
                <span>#{order.numero_pedido} - {order.nome}</span>
                <span className="text-muted-foreground">
                  {order.distancia_km ? `${order.distancia_km.toFixed(1)} km` : 'Calculando...'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryMap;
