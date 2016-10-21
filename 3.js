(function() {
    'use strict';

    angular
        .module('meineke')
        .controller('CareersCtrl', CareersCtrl);

    CareersCtrl.$inject = ['$log', 'RestService', 'CareersService'];

    function CareersCtrl($log, RestService, CareersService) {
        /*-------------------------------------------------------------------------
        Vars, objects, stuff like that
        -------------------------------------------------------------------------*/
        var vm = this,
            positions = [];

        // vm.states = CareersService.states();
        vm.states = [];
        vm.cities = [];
        vm.centers = [];
        vm.jobs = {};
        vm.jobOpenings = [];
        vm.hiddenSelectedState = null;
        vm.hiddenSelectedCity = null;
        vm.hiddenSelectedCenter = null;
        vm.hiddenSelectedJob = null;
        vm.verifyCareerType = verifyCareerType;
        vm.isStoreClosed = false;
        vm.storeIdExists = window.location.href.match(
            /(locations\/[A-Za-z]{2}\/([A-Za-z-]+)-(\d+)(\S+))/);

        var _stateDisplayText;
        var _cityDisplayText;
        var _interestDisplayText;

        /*-------------------------------------------------------------------------
        Private functions
        -------------------------------------------------------------------------*/

        function _syncJobOpenings(jobs) {
            vm.jobs = jobs;

            for (var i = 0, pos = []; i < vm.jobs.length; i += 1) {
                pos[vm.jobs[i].position] = vm.jobs[i].id;

                vm.jobOpenings.push({
                    id: vm.jobs[i].id,
                    job: vm.jobs[i].position
                });
            }
        }

        function _getJobs() {
            if (vm.storeIdExists && vm.storeIdExists[3]) {
                RestService
                    .careersForFranchise
                    .get({
                        id: parseInt(vm.storeIdExists[3])
                    })
                    .$promise
                    .then(function(response) {
                        if (response.$httpStatus === 200) {
                            _syncJobOpenings(response.data.message.jobs);
                        }
                    })
                    .catch(function(error) {
                        $log.error(error);
                    });

                return;
            }

            RestService
                .careers
                .get()
                .$promise
                .then(function(response) {
                    if (response.$httpStatus === 200) {
                        _syncJobOpenings(response.data.message.jobs);
                    }
                })
                .catch(function(error) {
                    $log.error(error);
                });
        }

        function _getStates() {
            CareersService
                .states()
                .get()
                .$promise
                .then(function(response) {
                    if (response.$httpStatus === 200) {
                        var states = [];
                        response.data.message.forEach(function(entry) {
                            states.push(entry.stateAbbreviation.toUpperCase());
                        });
                        vm.states = states;
                    }
                })
                .catch(function(error) {
                    $log.error(error);
                });
        }

        function _getCities(state) {
            CareersService
                .cities(state)
                .get()
                .$promise
                .then(function(response) {
                    if (response.$httpStatus === 200) {
                        var cities = [];
                        response.data.message.cities.forEach(function(entry) {
                            cities.push(entry.cityName.toUpperCase());
                        });
                        vm.cities = cities;
                    }
                })
                .catch(function(error) {
                    $log.error(error);
                });
        }

        function _getCenters(state, city) {
            CareersService
                .centers(state, city)
                .get()
                .$promise
                .then(function(response) {
                    if (response.$httpStatus === 200) {
                        var centers = [];
                        response.data.message.stores.forEach(function(entry) {
                            centers.push('(#' + entry.storeId + ') ' + entry.streetAddress1);
                        });
                        vm.centers = centers;
                    }
                })
                .catch(function(error) {
                    $log.error(error);
                });
        }

        function _selectState(item) {
            vm.hiddenSelectedState = item;
            vm.hiddenSelectedCity = '';
            vm.hiddenSelectedCenter = '';
            vm.centers = [];
            vm.cities = [];
            _getCities(vm.selectedState);
        }

        function _selectCity(item) {
            vm.hiddenSelectedCity = item;
            vm.hiddenSelectedCenter = '';
            vm.centers = [];
            _getCenters(vm.selectedState, vm.selectedCity);
        }

        function __selectCenter(item) {
            vm.hiddenSelectedCenter = item.match(/(\d+)/)[1];
        }

        function _selectJob(item) {
            vm.hiddenSelectedJob = item.id;
        }

        function _isStoreClosed() {
            var storeId = null,
                urlMatchesStoreId = window.location.href.match(/storeid=(\S+?(?=\&)|\S+\b)/);

            if (urlMatchesStoreId && urlMatchesStoreId.length) {
                storeId = urlMatchesStoreId[1];
                storeId = storeId.match(/(\d+)/)[1];

                RestService
                    .store
                    .get({
                        id: storeId
                    })
                    .$promise
                    .then(function(response) {
                        if (response.$httpStatus === 200) {
                            if (response && response.data.message[0].locationStatus === "CLOSED") {
                                vm.isStoreClosed = true;
                            }
                        }
                    })
                    .catch(function(error) {
                        $log.error(error);
                    });
            }
        }

        _getJobs();
        _getStates();

        /*-------------------------------------------------------------------------
        Public functions ///
        -------------------------------------------------------------------------*/

        function verifyCareerType(value, preselectedPosition) {
            /*
             * 'value' parameter = true => in the past, it meant we're on a career form where state and city are _not required so text would be without (*) asterisk.
             *  8/18/16 - made general-submission form with city/state required too, so the 'value' param is not needed anymore, as all precompleted messages are now with required (*)
             */
            _stateDisplayText = 'FILTER BY STATE *';
            _cityDisplayText = 'FILTER BY CITY *';
            _interestDisplayText = preselectedPosition ? preselectedPosition : 'INTERESTED IN *';

            vm.opts = {
                states: {
                    displayText: _stateDisplayText,
                    onSelect: _selectState
                },
                cities: {
                    displayText: _cityDisplayText,
                    onSelect: _selectCity
                },
                centers: {
                    displayText: 'FILTER BY CENTER *',
                    onSelect: __selectCenter
                },
                interest: {
                    displayText: _interestDisplayText,
                    onSelect: _selectJob
                }
            };
            _isStoreClosed();
        }
    }
})();