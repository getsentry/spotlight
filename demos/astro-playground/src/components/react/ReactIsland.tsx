export default function ReactIsland() {
  const throwError = () => {
    throw new Error('Error thrown from ReactIsland.tsx');
  };

  return (
    <div style={{ border: '3px solid blue', padding: '1rem' }}>
      <h3>Hi, I am a React Island</h3>
      <p>
        Nostrud dolore ad voluptate duis proident ullamco duis laboris mollit. Exercitation esse laborum id do ullamco
        tempor id fugiat. Id commodo anim ad dolore dolore irure officia elit est Lorem magna quis. Tempor ipsum magna
        labore quis Lorem commodo mollit ipsum labore sint aliqua. Est occaecat amet proident adipisicing quis aliquip
        fugiat commodo dolor. Consectetur cupidatat cillum occaecat mollit laborum voluptate ea.
      </p>
      <button onClick={throwError}>Click me to throw an error</button>
    </div>
  );
}
