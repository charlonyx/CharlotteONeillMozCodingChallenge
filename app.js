'use strict';
$(document).ready(function(){
	var wage_data, wage_data_by_f, wage_data_by_m, current_data;
	var page_size = 25;
	var current_page = 1;
	var hide_same = false;
	var filter_gap = 0;
	var filter_percent = 0;
	var job_search = "";
	var data_url = 'https://data.seattle.gov/api/views/cf52-s8er/rows.json?api_key=SCC1c0Cove7ypmBeuf3dTX2WZOk6qEfCAki6MoNi'
	
	$.getJSON(data_url, function(data){
		//get data from the api
		wage_data = data.data;
		current_data = wage_data.slice();
		populateTable(current_page, page_size);
		
		//sort data initially to save time
		wage_data_by_f = wage_data.slice().sort(function(a,b){
			return b[9] - a[9]
		});
		wage_data_by_m = wage_data.slice().sort(function(a,b){
			return b[12] - a[12]
		})
	});
	
	$('th').click(function(){
		//sort by chosen column
		if($(this).children('.sorted').hasClass('hidden')){
			$('.sorted').addClass('hidden');
			$(this).children('.sorted').removeClass('hidden');
			var sort_by = $(this).attr('id');
			if(sort_by == 'job_title'){
				current_data = wage_data.slice();
			} else if(sort_by == 'fwage'){
				current_data = wage_data_by_f.slice();
			} else if(sort_by == 'mwage'){
				current_data = wage_data_by_m.slice();
			}
			populateTable(current_page, page_size);
		}
	});
	
	$('#hide_same').click(function(){
		//hide job titles in which the male and female wages are the same
		hide_same = !hide_same;
		current_page = 1;
		populateTable(current_page, page_size);
	})
	
	$('#apply-gap-filter').click(function(){
		//filter for a minimum gap between wages
		var val = parseFloat($(this).siblings('input').val());
		filter_gap = val;
		populateTable(current_page, page_size);
	});
	
	$('#apply-percent-filter').click(function(){
		//filter for a percentage gap between wages
		var val = parseFloat($(this).siblings('input').val());
		filter_percent = val;
		populateTable(current_page, page_size);
	});
	
	$('#next_page').click(function(){
		var num_pages = Math.floor(current_data.length/page_size) + 1;
		if(current_page < num_pages){
			current_page += 1;
			selectPage(current_page);
		}
	});
	
	$('#prev_page').click(function(){
		if(current_page > 1){
			current_page -= 1;
			selectPage(current_page);
		}
	});
	
	$('.page_num').click(function(){
		var selected_page = parseInt($(this).text());
		if(selected_page != current_page){
			current_page = selected_page;
			selectPage(selected_page);
		}
	});
	
	$('#apply-per-page').click(function(){
		//change page size
		page_size = parseInt($(this).siblings('input').val());
		current_page = 1;
		selectPage(1);
	});
	
	function selectPage(page){
		//selects and displays a page, handles pagination
		var num_pages = Math.floor(current_data.length/page_size) + 1;
		var page_links = $('ul.pagination').children('li').slice(1,-1);
		$(page_links).removeClass('active');
		$(page_links).removeClass('hidden')
		
		if(num_pages < 5){
			var page_nums = [1,2,3,4,5]
			for(var i=0; i<page_nums.length; i++){
				var page_link = page_links[i];
				if(i < num_pages){
					$(page_link).children('a').text(page_nums[i].toString())
				} else {
					$(page_link).addClass('hidden');
				}
			}
			$($(page_links)[page-1]).addClass('active');
		} else if(page < 3){
			var page_nums = [1,2,3,4,5]
			for(var i=0; i<page_nums.length; i++){
				var page_link = page_links[i];
				$(page_link).children('a').text(page_nums[i].toString())
			}
			$($(page_links)[page-1]).addClass('active');
		} else if (page >= num_pages - 2){
			var page_nums = [num_pages-4, num_pages-3, num_pages-2, num_pages-1, num_pages]
			var page_links = $('ul.pagination').children('li').slice(1,-1);
			for(var i=0; i<page_nums.length; i++){
				var page_link = page_links[i];
				$(page_links).children('a').text(page_nums[i].toString())
			}
			$($(page_link)[num_pages-page]).addClass('active');
		} else {
			var page_nums = [page-2, page-1, page, page + 1, page + 2]
			var page_links = $('ul.pagination').children('li').slice(1,-1);
			for(var i=0; i<page_nums.length; i++){
				var page_link = page_links[i];
				$(page_link).children('a').text(page_nums[i].toString())
			}
			$($(page_links)[2]).addClass('active');
		}
		populateTable(current_page, page_size);
	}
	
	$('#search_jobs').click(function(){
		//apply a job title search
		job_search = $('#search').children('input').val();
		var search_data = []
		if(job_search.length > 0){
			for(var i=0; i < wage_data.length; i++){
				var job_title = wage_data[i][8];
				if(job_title.toLowerCase().search(job_search.toLowerCase()) != -1){
					search_data.push(wage_data[i]);
				}
			}
			current_data = search_data;
			selectPage(1);
		}
	});
	
	function populateTable(current_page, page_size){
		//populate the table with the current page of the current data
		$('td').remove();
		var html_row = '<tr></tr>';
		var html_cell = '<td></td>';
		var data_start = page_size * (current_page - 1);
		var idx = data_start;
		var rows = 0;
		
		while(rows < page_size && idx < current_data.length){
			var add_row = true;
			var job_title=current_data[idx][8];
			var female_wage = current_data[idx][9];
			var male_wage = current_data[idx][12];
		
			var num_gap = Math.abs(parseFloat(male_wage)-parseFloat(female_wage));
			
			//filters
			if(hide_same && num_gap == 0){
				//filter equal results if selected
				add_row = false;
			} else if((female_wage == null || male_wage == null) && (filter_percent > 0 || filter_gap > 0)){
				//if num gap or percent gap filter, hide all results with no data for a wage
				add_row = false;
			} else if(filter_gap > 0 && num_gap <= filter_gap){
				//filter by num gap if selected	
				add_row = false;
			} else if(filter_percent > 0){
				//filter by percentage gap if selected
				var higher_wage = female_wage > male_wage ? female_wage : male_wage;
				var percent_gap = (num_gap/higher_wage)*100.;
				if(percent_gap <= filter_percent){
					add_row = false;
				}
			} 		
			
			if(add_row){
				var row = $(html_row).appendTo('tbody');
				var female_wage_text = (female_wage ? '$' + female_wage : 'No data');
				var male_wage_text = (male_wage ? '$' + male_wage : 'No data');
				
				$(html_cell).text(job_title).appendTo(row);
				$(html_cell).text(female_wage_text).appendTo(row);
				$(html_cell).text(male_wage_text).appendTo(row);
				rows += 1;
			}	
			idx += 1;
		}
	}
});

