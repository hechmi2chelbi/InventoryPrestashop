import { PriceHistory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { InfoIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PredictiveChartProps {
  priceHistory: PriceHistory[];
}

export default function PredictiveChart({ priceHistory }: PredictiveChartProps) {
  const { toast } = useToast();
  
  if (!priceHistory || priceHistory.length < 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prédiction de prix</CardTitle>
          <CardDescription>
            Insuffisamment de données pour générer une prédiction fiable.
            Au moins 5 points de données sont nécessaires.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Trier l'historique pour obtenir une série chronologique
  const sortedHistory = [...priceHistory].sort(
    (a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date();
      const dateB = b.date ? new Date(b.date) : new Date();
      return dateA.getTime() - dateB.getTime();
    }
  );

  // Extraire les prix et les dates pour l'analyse
  const prices = sortedHistory.map(item => parseFloat(item.price));
  const dates = sortedHistory.map(item => item.date ? new Date(item.date) : new Date());
  
  // Générer des prédictions simples en utilisant une régression linéaire
  // Transformation des indices en valeurs pour la régression
  const xValues = Array.from({ length: dates.length }, (_, i) => i);
  const yValues = prices;

  // Calculer la moyenne des x et y
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;

  // Calculer la pente (m) et l'ordonnée à l'origine (b) pour l'équation y = mx + b
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < xValues.length; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Fonction pour prédire le prix
  const predictPrice = (dayIndex: number) => {
    return slope * dayIndex + intercept;
  };

  // Générer des prédictions pour les prochains jours
  const predictionDays = 30; // Prédire pour les 30 prochains jours
  const lastDate = dates[dates.length - 1];
  const lastPrice = prices[prices.length - 1];
  
  const predictions = [];
  for (let i = 1; i <= predictionDays; i++) {
    const predictedDate = addDays(lastDate, i);
    const predictedPrice = predictPrice(xValues.length - 1 + i);
    
    // Ajouter une petite variation aléatoire pour rendre la prédiction plus réaliste
    const randomFactor = 0.98 + Math.random() * 0.04; // entre 0.98 et 1.02
    
    predictions.push({
      date: format(predictedDate, 'dd/MM/yyyy'),
      prix: null,
      prediction: predictedPrice * randomFactor,
    });
  }

  // Préparer les données pour le graphique
  const chartData = [
    ...sortedHistory.map(item => ({
      date: format(item.date ? new Date(item.date) : new Date(), 'dd/MM/yyyy'),
      prix: parseFloat(item.price),
      prediction: null,
    })),
    ...predictions,
  ];

  // Calculer le prix prédit dans 30 jours et la variation attendue
  const currentPrice = lastPrice;
  const predictedPrice = predictions[predictions.length - 1].prediction;
  const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  
  // Calculer la confiance de la prédiction (R-squared)
  let ssRes = 0; // somme des carrés des résidus
  let ssTot = 0; // somme totale des carrés
  
  for (let i = 0; i < xValues.length; i++) {
    const prediction = predictPrice(xValues[i]);
    ssRes += Math.pow(yValues[i] - prediction, 2);
    ssTot += Math.pow(yValues[i] - yMean, 2);
  }
  
  // Le R-squared est une mesure de la qualité de l'ajustement
  const rSquared = 1 - (ssRes / ssTot);
  const confidenceLevel = rSquared * 100;
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 80) return { label: "Élevée", color: "bg-green-500" };
    if (confidence > 50) return { label: "Moyenne", color: "bg-yellow-500" };
    return { label: "Faible", color: "bg-red-500" };
  };
  
  const confidenceInfo = getConfidenceLabel(confidenceLevel);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Prédiction de prix (30 jours)</CardTitle>
          <CardDescription>
            Basée sur l'analyse des tendances historiques
          </CardDescription>
        </div>
        <Badge 
          className={`${confidenceInfo.color} hover:${confidenceInfo.color} cursor-pointer`}
          onClick={() => {
            toast({
              title: "À propos de la fiabilité",
              description: `La fiabilité de ${confidenceInfo.label.toLowerCase()} (${confidenceLevel.toFixed(1)}%) est basée sur la qualité de l'ajustement statistique des données historiques.`,
            });
          }}
        >
          Fiabilité: {confidenceInfo.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-neutral-500 mb-1">Prix actuel</div>
              <div className="text-2xl font-semibold">{currentPrice.toFixed(2)} €</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-neutral-500 mb-1">Prix prédit (dans 30j)</div>
              <div className="text-2xl font-semibold">{predictedPrice.toFixed(2)} €</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-neutral-500 mb-1">Variation attendue</div>
              <div className={`text-2xl font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis
                  width={80}
                  tickFormatter={(value) => `${value} €`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (value === null) return ['N/A', name === 'prix' ? 'Prix réel' : 'Prédiction'];
                    return [`${Number(value).toFixed(2)} €`, name === 'prix' ? 'Prix réel' : 'Prédiction'];
                  }}
                  labelFormatter={(date) => `Date: ${date}`}
                />
                <Legend 
                  payload={[
                    { value: 'Prix historique', type: 'line', color: '#0078D4' },
                    { value: 'Prédiction', type: 'line', color: '#FF8C00' }
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="prix"
                  stroke="#0078D4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="prediction"
                  stroke="#FF8C00"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
                <ReferenceLine
                  x={chartData[sortedHistory.length - 1].date}
                  stroke="#666"
                  strokeDasharray="3 3"
                  label={{ value: "Aujourd'hui", position: 'insideTopRight' }}
                />
                <ReferenceArea
                  x1={chartData[sortedHistory.length - 1].date}
                  x2={chartData[chartData.length - 1].date}
                  y1={0}
                  fillOpacity={0.05}
                  fill="#FF8C00"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center justify-center text-sm text-neutral-500">
            <InfoIcon className="h-4 w-4 mr-1" />
            <span>Les prédictions sont basées sur l'analyse de tendances et doivent être utilisées à titre indicatif uniquement.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}