import React, { useEffect, useState } from 'react';

const Precedents = () => {
  const [precedents, setPrecedents] = useState([]);
  const [query, setQuery] = useState('');

  // 获取静态示例资源数据
  const fetchPrecedents = (searchQuery = '') => {
    // 暂不使用 searchQuery，直接返回全部示例数据
    fetch('http://localhost:8000/precedents')
      .then((response) => response.json())
      .then((data) => setPrecedents(data))
      .catch((error) => console.error('Error fetching precedents:', error));
  };

  useEffect(() => {
    fetchPrecedents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // 当前仅打印搜索词，并重新调用 fetchPrecedents（返回静态数据）
    console.log('Search query:', query);
    fetchPrecedents(query);
  };

  return (
    <div>
      <h1>Precedents</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search precedents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {precedents.length === 0 ? (
        <p>Loading precedents...</p>
      ) : (
        <ul>
          {precedents.map((precedent) => (
            <li key={precedent.id}>
              <h3>{precedent.title}</h3>
              <p>{precedent.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Precedents;
