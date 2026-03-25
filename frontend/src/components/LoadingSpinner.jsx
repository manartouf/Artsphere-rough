const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center w-full min-h-[200px]">
      <div className="w-10 h-10 border-4 border-[#6c3483] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;