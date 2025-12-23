import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FormBuilderPage } from './pages/FormBuilderPage';
import { SampleViewerPage } from './pages/SampleViewerPage';
import './App.css';

const App = () => {
  return (
    <BrowserRouter basename="/fusionforms">
      <Routes>
        <Route path="/" element={<FormBuilderPage />} />
        <Route path="/samples" element={<SampleViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
