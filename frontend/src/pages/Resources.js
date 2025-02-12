import React, { useEffect, useState } from 'react';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState('');

  // 获取静态示例资源数据
  const fetchResources = (searchQuery = '') => {
    // 暂不使用 searchQuery，直接返回全部示例数据
    fetch('http://localhost:8000/resources')
      .then((response) => response.json())
      .then((data) => setResources(data))
      .catch((error) => console.error('Error fetching resources:', error));
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // 当前仅打印搜索词，并重新调用 fetchResources（返回静态数据）
    console.log('Search query:', query);
    fetchResources(query);
  };

  return (
    <div>
      <h1>Resources</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search resources..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {resources.length === 0 ? (
        <p>Loading resources...</p>
      ) : (
        <ul>
          {resources.map((resource) => (
            <li key={resource.id}>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Resources;
