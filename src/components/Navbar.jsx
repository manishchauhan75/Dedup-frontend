import { Link } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <Layers className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold text-white">Dedup Service</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Run Detection</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
