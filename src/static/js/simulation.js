const delay = ms => new Promise(res => setTimeout(res, ms));

document.addEventListener("alpine:init", () => {
  const UNEXPECTED_ERROR = "Desculpe, ocorreu um erro inesperado. Por favor, tente mais tarde";
  const PUBLIC_API_BASE_URL = "https://q8klm53d43.execute-api.us-east-1.amazonaws.com/Prod";

  const getCachedData = (key) => {
    const cachedItem = localStorage.getItem(key);
    if (cachedItem) {
      const { value, expiration } = JSON.parse(cachedItem);
      const currentTime = Date.now();
      if (currentTime < expiration) {
        // The cached value is still valid
        return value;
      }
    }
    return null;
  }

  const calculate = async ({ energyConsumption, zipCode, powerEnergyDistributorId }) => {
    const key = `${energyConsumption}_${zipCode}_${powerEnergyDistributorId}`;

    const cachedItem = getCachedData(key);
    if (cachedItem) {
      console.log('Cached value:', cache);
      return cachedItem;
    } else {
      console.log('No valid cached value found.');
      try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/simulations/calculate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            energyConsumption,
            powerEnergyDistributorId,
            zip: zipCode
          })
        });

        const data = await response.json();
        const expirationTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        const newItem = { value: data, expiration: expirationTime };
        localStorage.setItem(key, JSON.stringify(newItem));

        console.log('Fetched API data:', data);
        return data;
      } catch (error) {
        console.log('Error fetching API data:', error);
        return null;
      }
    }
  }

  let buttonText = "Faça uma simulação";

  Alpine.data("simulationForm", () => ({
    loading: false,
    buttonText,
    powerDistributors: [],
    zipCode: "",
    energyConsumption: "",
    powerDistributorId: "",
    email: "fake@email.com",
    payback: null,
    monthlyLoanAmount: null,
    loanInstallments: null,
    setLoading(loading, loadingText = "Carregando...") {
      this.loading = loading;

      if (loading) {
        buttonText = this.buttonText;
        this.buttonText = loadingText;
      } else {
        this.buttonText = buttonText;
      }
    },
    async calculate() {
      this.setLoading(true, "Calculando...");
      const result = await calculate(this);

      console.log('TODO: display results: ' + JSON.stringify(result));
      this.setLoading(false);
    },
    async fetchPowerDistributors(zipCode) {
      this.setLoading(true)

      try {
        const response = await fetch(`${PUBLIC_API_BASE_URL}/simulations/power-distributors/${zipCode.replaceAll(/[-]/gi, '')}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          }
        });

        const result = await response.json()
        this.powerDistributors = result.power_distributors;

      } catch (error) {
        // alert(UNEXPECTED_ERROR);
        this.powerDistributors = [{ id: 1, name: 'ENEL' }]
      }

      this.setLoading(false)
    }
  }));
});
