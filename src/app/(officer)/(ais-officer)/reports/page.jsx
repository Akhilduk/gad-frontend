'use client'
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';

// Register the components to use in the charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement // Make sure BarElement is registered here for the Bar chart
);

const ApplicationsPage = () => {

  // Line chart data
  const lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June'],
    datasets: [
      {
        label: 'Users Over Time',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  // Pie chart data
  const pieChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        data: [300, 50, 100],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  // Vertical Bar chart data
  const barChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue',
        data: [100, 200, 300, 400],
        backgroundColor: '#42A5F5',
        borderColor: '#1E88E5',
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4 mt-5">
        <div className="sm:col-span-12 lg:col-span-6 flex justify-center items-center">
          <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
            <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900 flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Report Graph 1
              </h3>
            </div>
            <div className="mx-auto w-full" style={{ height: '400px' }}>
              <Line 
                data={lineChartData} 
                options={{
                  responsive: true,         // Make the chart responsive
                  maintainAspectRatio: false, // Allow it to take full width
                  height: 400, // You can also set a specific height for the chart itself
                }} 
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-12 lg:col-span-6 flex justify-center items-center">
          <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
            <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900  flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Report Graph 2
              </h3>
            </div>
            <div className="mx-auto" style={{ height: '400px' }}>
                <Pie data={pieChartData} 
                  options={{
                  responsive: true,         // Make the chart responsive
                  maintainAspectRatio: false, // Allow it to take full width
                  height: 400, // You can also set a specific height for the chart itself
                }} 
                />
            </div>
          </div>
        </div>

        <div className="sm:col-span-12 lg:col-span-12 flex justify-center items-center">
          <div className="bg-white p-3 pt-0 rounded-xl border w-full mb-3 dark:bg-gray-800 dark:border-gray-900">
            <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-3 dark:bg-gray-800 dark:border-gray-900  flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Report Graph 3
              </h3>
            </div>
            <div className="mx-auto max-w-12xl" style={{ height: '400px' }}>
              <Bar data={barChartData} 
                options={{
                  responsive: true,         // Make the chart responsive
                  maintainAspectRatio: false, // Allow it to take full width
                  height: 400, // You can also set a specific height for the chart itself
                }} 
              />
            </div>
          </div>
        </div>
      </div>


          

    </>
  );
};

export default ApplicationsPage;

