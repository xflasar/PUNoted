{
	/* <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Autocomplete
              options={sectorOptions}
              value={selectedSector}
              getOptionLabel={(option) => (option ? option.name : "")}
              onChange={(_event, newValue) => {
                setSelectedSystem(null);
                setSystemOptions([]);
                setSelectedPlanet(null);
                setPlanetOptions([]);
                setSelectedSector(newValue);
              }}
              isOptionEqualToValue={(option, value) =>
                option.externalsectorid === value.externalsectorid
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="1. Sector"
                  variant="outlined"
                  fullWidth
                  required
                />
              )}
              sx={{ flex: 1 }}
              freeSolo={false}
            />
            <Autocomplete
              options={systemOptions}
              value={selectedSystem}
              getOptionLabel={(option) => (option ? option.name : "")}
              onChange={(_event, newValue) => {
                setSelectedPlanet(null);
                setPlanetOptions([]);
                setSelectedSystem(newValue);
              }}
              isOptionEqualToValue={(option, value) =>
                option.systemid === value.systemid
              }
              disabled={!selectedSector || isLoadingSystems}
              loading={isLoadingSystems}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="2. System"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {isLoadingSystems ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              sx={{ flex: 1 }}
              freeSolo={false}
            />
            <Autocomplete
              options={planetOptions}
              value={selectedPlanet}
              getOptionLabel={(option) => (option ? option.name : "")}
              onChange={(_event, newValue) =>
                setSelectedPlanet(newValue || null)
              }
              isOptionEqualToValue={(option, value) =>
                option.planetid === value.planetid
              }
              disabled={!selectedSystem || isLoadingPlanets}
              loading={isLoadingPlanets}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="3. Planet/Site"
                  variant="outlined"
                  fullWidth
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {isLoadingPlanets ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              sx={{ flex: 1 }}
              freeSolo={false}
            />
          </Box>
          
          )} */
}
