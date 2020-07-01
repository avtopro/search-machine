import React, { useState } from 'react';
import Search from './components/Search';
import initFetchMachine from './machines/fetchMachine';
import searchResult from './searchResult.json';
import './App.css';

const fetchMachine = initFetchMachine(/* searchResult */);

function App() {
    const [appKey, setNewKey] = useState(Date.now());
    return (
        <div className="search-app">
            <Search
                key={appKey}
                fetchMachine={fetchMachine}
                reset={() => setNewKey(appKey + 1)}
            />
        </div>
    );
}

export default App;
