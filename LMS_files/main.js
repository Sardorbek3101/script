function lmsMain() {
	var _ = {}

	_.lang = document.documentElement.lang;
	
	_.trans = (attr) => {
		var localize =  {
			'offline' : {
				ru : 'Вы офлайн.',
				uzl: 'Siz oflaynsiz.',
				uzc: 'Сиз офлайнсиз.',
				en : 'You are offline.',
				kar: 'Вы офлайн.',
			},
			'online' : {
				ru : 'Подключение к Интернету восстановлено.',
				uzl: 'Internetga ulanish qayta tiklandi.',
				uzc: 'Интернетга уланиш қайта тикланди.',
				en : 'Your internet connection was restored.',
				kar: 'Подключение к Интернету восстановлено.',
			}
		};

		return localize[attr][_.lang] || attr
	}

	_.showMessage = (message) => {
		var nodeElement = document.createElement("div");

		if (message == 'offline') {
			nodeElement.innerHTML = '<i class="fa fa-wifi text-muted"></i> ' + _.trans('offline')
			_.initToastify(nodeElement)
		} else if (message == 'online') {
			nodeElement.innerHTML = '<i class="fa fa-wifi text-success"></i> ' + _.trans('online')
			_.initToastify(nodeElement)
		}
	}

	_.initToastify = (nodeElement) => {
		$('.toastify').remove()
		Toastify({
			node: nodeElement,
			gravity: "bottom",
			position: "left",
			duration: -1,
			close: true,
			newWindow: true,
			style: {
				background: '#efefef',
				color: '#222',
				width: '300px'
			}
			
		}).showToast();
	}

	_.onlineOfflineDetector = () => {
		window.addEventListener('online', () => {
			_.showMessage('online')
		});

		window.addEventListener('offline', () => {
			_.showMessage('offline')
		});
	},

	_.setCsrfToken = () => {
		$.ajaxSetup({
			headers: {
					"X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
			}
		});
	}

	_.initMainMasks = () => {
		$('.js-date-mask').mask('99-99-9999', { autoclear: false })
		$('.js-datetime-mask').mask('99-99-9999 99:99', { autoclear: false })
		$('.js-year-mask').mask('9999', { autoclear: false })
		$('.js-hour').mask('99:99', { autoclear: false })
	}

	_.init = () => {
		_.initMainMasks()
		_.setCsrfToken()
		_.onlineOfflineDetector()
	}

	return _
}

$(() => {
	new lmsMain().init()
})


